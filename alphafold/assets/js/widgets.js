/* ============ 页面小组件（各页按需加载，元素不存在时自动跳过） ============ */

/* ---------- 通用标签页：<div class="tabs" data-tabs="#m1,#m2,#m3"> ---------- */
document.querySelectorAll('.tabs[data-tabs]').forEach(box => {
  const targets = box.dataset.tabs.split(',').map(s => document.querySelector(s.trim())).filter(Boolean);
  const tabs = [...box.querySelectorAll('.tab')];
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('on'));
      t.classList.add('on');
      targets.forEach((p, j) => p.classList.toggle('on', j === i));
    });
  });
});

/* ---------- 2.1 时间轴 ---------- */
const TL = [
  { y: '1973', t: 'Anfinsen 法则', d: '核糖核酸酶变性与复性实验表明，一级序列包含了决定空间结构所需的全部信息。这为“从序列预测结构”提供了最初的合法性依据，也让此后半个世纪的方法都在回答同一个问题——序列如何折叠。' },
  { y: '1994', t: 'CASP 盲测启动', d: 'CASP 以“未发表、未解析”的靶标做盲测，用统一指标比较各组预测。它把主观的“看起来像”变成可比的数字，让研究社区有了共同基准；今天引用的精度数字几乎都出自这一体系。' },
  { y: '2018', t: 'AlphaFold1 登场', d: 'CASP13 上 AlphaFold1 以打分函数加深度残差网络预测残基间距离，首次把“距离图 + 优化”做到领先，但尚未端到端；它的成功提示：深度学习可以重塑这一问题的解法。' },
  { y: '2020', t: 'AlphaFold2 与 CASP14', d: '中位 GDT 92.4、主链 Cα r.m.s.d. 0.96 Å，与次优方法（约 2.8 Å）拉开数量级差距；同期的 RoseTTAFold 用三轨网络也达到接近水平。这一届被视为“结构预测问题基本解决”的标志。' },
  { y: '2021', t: '数据库与开源', d: 'AlphaFold 数据库开放 2 亿余条预测结构，RoseTTAFold 代码与服务器开放。使用方式随之改变：研究者先检索已有模型，把算力留给数据库里没有的序列、复合物与突变体。' },
  { y: '2024', t: 'AF3 与诺贝尔化学奖', d: 'AlphaFold3 把能力扩展到核酸、配体与共价修饰，但未开放训练代码，引发开放性争议；同年诺贝尔化学奖授予 Baker、Hassabis 与 Jumper——结构预测与蛋白质设计被同时承认。' }
];
(function () {
  const box = document.getElementById('timeline');
  if (!box) return;
  const body = document.getElementById('tlBody');
  TL.forEach((it, i) => {
    const d = document.createElement('div');
    d.className = 'tl-item' + (i === 0 ? ' on' : '');
    d.innerHTML = '<b>' + it.y + '</b><span>' + it.t + '</span>';
    d.addEventListener('click', () => {
      box.querySelectorAll('.tl-item').forEach(x => x.classList.remove('on'));
      d.classList.add('on');
      body.innerHTML = '<h4><span class="yr">' + it.y + '</span>　' + it.t + '</h4><p>' + it.d + '</p>';
    });
    box.appendChild(d);
  });
  if (body) body.innerHTML = '<h4><span class="yr">' + TL[0].y + '</span>　' + TL[0].t + '</h4><p>' + TL[0].d + '</p>';
})();

/* ---------- 2.2 pLDDT 判读器 ---------- */
(function () {
  const s = document.getElementById('plddt');
  if (!s) return;
  const out = document.getElementById('plddtOut');
  const bar = document.getElementById('plddtBar');
  const v = document.getElementById('plddtVerdict');
  function paint() {
    const x = +s.value;
    out.textContent = x;
    let color, label, text;
    if (x >= 90) { color = '#0a7d5a'; label = '很高'; text = '主链与侧链大多可信，可用于分子置换、口袋分析等结构层面的推断。'; }
    else if (x >= 70) { color = '#1f6fb2'; label = '可信'; text = '主链构象基本可靠；侧链取向与细节仍需谨慎，涉及配体或突变效应时应结合实验。'; }
    else if (x >= 50) { color = '#c9801d'; label = '较低'; text = '只能当作区域级假设：整体折叠可能有参考价值，但局部构象不宜直接用于机制结论。'; }
    else { color = '#b3403f'; label = '很低'; text = '大概率是无序区或错误折叠；这类区域不应被当作“结构证据”，需实验或其他方法补充。'; }
    bar.children[0].style.width = x + '%';
    bar.children[0].style.background = color;
    bar.children[1].style.width = (100 - x) + '%';
    v.innerHTML = 'pLDDT = <b>' + x + '</b>　<span class="badge" style="background:' + color + '">' + label +
      '</span><div style="color:var(--muted);margin-top:4px">' + text + '</div>';
  }
  s.addEventListener('input', paint);
  paint();
})();

/* ---------- 3.1 三轨交互 ---------- */
(function () {
  const boxes = document.querySelectorAll('.track-svg .box');
  const note = document.getElementById('trackNote');
  if (!boxes.length || !note) return;
  const info = {
    '1d': ['1D 轨道：序列与 MSA', '以序列位置为轴，编码同源序列的保守性与共变关系。它决定“哪些残基在进化上被绑定在一起”，是远端接触信号的主要来源，但本身不含几何信息。'],
    '2d': ['2D 轨道：距离与取向', '以残基对为轴，编码距离分布与相对取向。它把 1D 的共变信号转成可用几何约束，也是全原子版本中原子键图的承载层。'],
    '3d': ['3D 轨道：原子坐标', '以笛卡尔坐标表示当前结构，并用 SE(3)-Transformer 保持旋转—平移等变。三轨模型的关键差异就在这里：坐标不是最后的输出，而是每一步的输入之一。']
  };
  boxes.forEach(g => {
    g.addEventListener('click', () => {
      boxes.forEach(x => x.classList.remove('on'));
      g.classList.add('on');
      const it = info[g.dataset.track];
      note.innerHTML = '<b>' + it[0] + '</b><br>' + it[1];
    });
  });
})();

/* ---------- 3.2 RFdiffusion 去噪演示 ---------- */
(function () {
  const cv = document.getElementById('dnCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, N = 64;
  let mode = 'free', t = 0.18, raf = 0;

  function targetPath() {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      let x, y;
      if (mode === 'binder') {
        x = 420 + 150 * Math.sin(u * Math.PI * 1.6 + 0.6);
        y = 118 + 34 * Math.sin(u * Math.PI * 3.2) + 26 * u;
      } else {
        x = 120 + u * 430 + 34 * Math.sin(u * 9.5);
        y = 122 + 46 * Math.sin(u * 6.4) + 17 * Math.sin(u * 26 + 1.1);
      }
      pts.push([x, y]);
    }
    return pts;
  }
  function noisePath(seed) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pts = [];
    for (let i = 0; i < N; i++) pts.push([90 + rnd() * 470, 60 + rnd() * 140]);
    return pts;
  }
  const noise = noisePath(20240711);
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function receptor() {
    ctx.strokeStyle = 'rgba(31,111,178,.22)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = 640 + u * 250, y = 120 + 44 * Math.sin(u * 6.4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(31,111,178,.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = 640 + u * 250, y = 120 + 44 * Math.sin(u * 6.4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(31,111,178,.8)'; ctx.font = '12px "Microsoft YaHei",sans-serif';
    ctx.fillText('结合靶标（固定）', 700, 214);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const tg = targetPath(), e = ease(t), jit = (1 - t) * 20;
    if (mode === 'binder') receptor();
    if (t < .98) {
      ctx.fillStyle = 'rgba(150,166,190,' + (0.34 * (1 - t) + 0.05) + ')';
      noise.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 6.284); ctx.fill(); });
    }
    const pts = tg.map((p, i) => {
      const n = noise[i];
      const jx = Math.sin(i * 3.7 + t * 9) * jit, jy = Math.cos(i * 2.9 + t * 7) * jit;
      return [n[0] + (p[0] - n[0]) * e + jx, n[1] + (p[1] - n[1]) * e + jy];
    });
    ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const g = i / pts.length;
      ctx.strokeStyle = 'rgba(' + Math.round(31 + 55 * g) + ',' + Math.round(111 - 62 * g) + ',' +
        Math.round(178 - 18 * g) + ',' + (0.35 + 0.6 * e) + ')';
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,32,96,' + (0.25 + 0.55 * e) + ')';
    for (let i = 0; i < pts.length; i += 2) {
      ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 1.9 + 1.6 * e, 0, 6.284); ctx.fill();
    }
    let d2 = 0;
    for (let i = 0; i < pts.length; i++) d2 += Math.pow(pts[i][0] - tg[i][0], 2) + Math.pow(pts[i][1] - tg[i][1], 2);
    const rmsd = Math.sqrt(d2 / pts.length);
    const score = Math.max(0, Math.round(100 * Math.exp(-rmsd / 42)));
    document.getElementById('dnScore').textContent = score + '%';
    document.getElementById('dnStep').textContent = Math.round(t * 200) + ' / 200';
    document.getElementById('denoiseOut').textContent = Math.round(t * 100) + '%';
    ctx.fillStyle = 'rgba(91,107,130,.9)'; ctx.font = '12px "Microsoft YaHei",sans-serif';
    ctx.fillText(t < .3 ? '随机坐标（噪声）' : t < .8 ? '逐步收敛' : '可设计骨架', 96, 30);
  }
  const slider = document.getElementById('denoise');
  slider.addEventListener('input', () => { t = +slider.value / 100; draw(); });
  document.getElementById('dnFree').addEventListener('click', () => { mode = 'free'; animate(); });
  document.getElementById('dnBinder').addEventListener('click', () => { mode = 'binder'; animate(); });
  document.getElementById('dnReset').addEventListener('click', () => { t = 0; slider.value = 0; draw(); });
  function animate() {
    cancelAnimationFrame(raf);
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const k = Math.min(1, (ts - start) / 1500);
      t = k; slider.value = Math.round(k * 100); draw();
      if (k < 1) raf = requestAnimationFrame(step);
    }
    draw();
    raf = requestAnimationFrame(step);
  }
  draw();
})();

/* ---------- 4.2 ESM 规模滑块 ---------- */
(function () {
  const s = document.getElementById('esm');
  if (!s) return;
  const DATA = [
    { n: '8M', r1: 7.7, p1: 59.7, x1: 12.5, r2: 4.4, p2: 57.2, x2: 11.5 },
    { n: '35M', r1: 7.0, p1: 65.6, x1: 11.3, r2: 3.9, p2: 61.8, x2: 10.9 },
    { n: '150M', r1: 3.2, p1: 69.9, x1: 6.8, r2: 4.5, p2: 59.7, x2: 9.6 },
    { n: '650M', r1: 2.9, p1: 75.0, x1: 5.4, r2: 4.3, p2: 67.1, x2: 8.0 },
    { n: '3B', r1: 2.8, p1: 75.8, x1: 4.3, r2: 4.0, p2: 66.5, x2: 6.7 },
    { n: '15B', r1: 2.6, p1: 75.6, x1: 4.1, r2: 2.7, p2: 75.8, x2: 2.1 }
  ];
  const out = document.getElementById('esmOut');
  function paint() {
    const d = DATA[+s.value];
    out.textContent = d.n;
    document.getElementById('esmR1').textContent = d.r1.toFixed(1);
    document.getElementById('esmP1').textContent = d.p1.toFixed(1);
    document.getElementById('esmX1').textContent = d.x1.toFixed(1);
    document.getElementById('esmR2').textContent = d.r2.toFixed(1);
    document.getElementById('esmP2').textContent = d.p2.toFixed(1);
    document.getElementById('esmX2').textContent = d.x2.toFixed(1);
    document.getElementById('esmBar1').style.width = d.p1 + '%';
    document.getElementById('esmBar2').style.width = d.p2 + '%';
  }
  s.addEventListener('input', paint);
  paint();
})();

/* ---------- 文献列表 ---------- */
const REFS = [
  { id: 1, grp: 'cn', doi: '', q: '蛋白质三维结构解析的方法 徐甲强',
    t: '徐甲强, 崔倩倩. 蛋白质三维结构解析的方法[J]. 河南师范大学学报(自然科学版), 2023, 51(4): 116-124.',
    abs: '系统梳理 X 射线晶体衍射、核磁共振与冷冻电镜的原理、流程与适用范围，是第一章方法学部分的主要依据。' },
  { id: 2, grp: 'cn', doi: '', q: 'AlphaFold 和蛋白质结构预测 郭贝一',
    t: '郭贝一, 郭晓强. AlphaFold 和蛋白质结构预测[J]. 科学, 2024, 76(5): 39-44.',
    abs: '面向公众介绍 AlphaFold 的缘起、技术路线与影响，并回顾结构生物学的历史脉络：从肌红蛋白到 CASP14。' },
  { id: 3, grp: 'cn', doi: '', q: 'AlphaFold 时代的蛋白质相关人工智能算法及其应用 孙雨楠',
    t: '孙雨楠, 叶川, 赵东宇. AlphaFold 时代的蛋白质相关人工智能算法及其应用[J]. 生理科学进展, 2025, 56(3): 202-209.',
    abs: '综述 AlphaFold 时代的相关算法谱系与应用场景，用于讨论数据库化对研究方式的影响。' },
  { id: 4, grp: 'cn', doi: '', q: '蛋白质结构预测模型 AlphaFold2 的应用进展 张弘',
    t: '张弘, 王慧洁, 鲁睿捷, 等. 蛋白质结构预测模型 AlphaFold2 的应用进展[J]. 生物工程学报, 2024, 40(5): 1406-1420.',
    abs: '按应用领域归纳 AF2 的实践：结构解析辅助、功能注释、药物发现与酶工程。' },
  { id: 5, grp: 'cn', doi: '', q: 'AlphaFold 结构预测的重大突破及其对蛋白质研究的影响与挑战 宫维斌',
    t: '宫维斌. AlphaFold 结构预测的重大突破及其对蛋白质研究的影响与挑战[J]. 生物化学与生物物理进展, 2024, 51(12): 3073-3083.',
    abs: '强调“突破”与“边界”并存：复合物、无序区、配体与动态构象仍是难点，并讨论开放性与可重复性。' },
  { id: 6, grp: 'cn', doi: '', q: 'AI 蛋白质结构预测在生物医学领域的应用 车禹萱',
    t: '车禹萱, 吴睿, 郑积敏. AI 蛋白质结构预测在生物医学领域的应用[J]. 化学教育(中英文), 2026, 47(4).',
    abs: '从生物医学与教学视角讨论预测模型的使用方式与误区，强调不能把输出直接当作结论。' },
  { id: 7, grp: 'cn', doi: '', q: '人工智能驱动的蛋白质结构预测进展与应用前景 朱吕帅',
    t: '朱吕帅, 李志鹏, 刘欣悦, 等. 人工智能驱动的蛋白质结构预测进展与应用前景[J]. 生物学杂志, 2025, 42(5): 1-9.',
    abs: '梳理从共演化信号到语言模型的演进，并展望设计、动态与实验闭环三个方向。' },
  { id: 8, grp: 'en', doi: '10.1038/s41586-021-03819-2', q: 'Highly accurate protein structure prediction with AlphaFold',
    t: 'Jumper J, Evans R, Pritzel A, et al. Highly accurate protein structure prediction with AlphaFold[J]. Nature, 2021, 596: 583-589.',
    abs: 'AlphaFold2 原始论文：Evoformer 双轨表示、等变结构模块、recycling 与自蒸馏训练；CASP14 中位 GDT 92.4、Cα r.m.s.d. 0.96 Å。' },
  { id: 9, grp: 'en', doi: '10.1126/science.abj8754', q: 'Accurate prediction of protein structures and interactions three-track',
    t: 'Baek M, DiMaio F, Anishchenko I, et al. Accurate prediction of protein structures and interactions using a three-track neural network[J]. Science, 2021, 373: 871-876.',
    abs: 'RoseTTAFold 原始论文：1D/2D/3D 三轨并行、260 残基截断训练、8 GB 显存与约 10 分钟推理；CASP14 平均 TM-score 约 0.75。' },
  { id: 10, grp: 'en', doi: '10.1038/s41586-024-07487-w', q: 'Accurate structure prediction of biomolecular interactions AlphaFold 3',
    t: 'Abramson J, Adler J, Dunger J, et al. Accurate structure prediction of biomolecular interactions with AlphaFold 3[J]. Nature, 2024, 630: 493-500.',
    abs: 'AlphaFold3：把扩散模块引入结构生成，扩展到核酸、配体与共价修饰；同时记录抗原—抗体等任务的失败率与手性错误。' },
  { id: 11, grp: 'en', doi: '10.1126/science.adl2528', q: 'Generalized biomolecular modeling and design RoseTTAFold All-Atom',
    t: 'Krishna R, Wang J, Ahern W, et al. Generalized biomolecular modeling and design with RoseTTAFold All-Atom[J]. Science, 2024, 384(6693): eadl2528.',
    abs: '全原子版本：蛋白与核酸按残基/碱基表示，其余按原子图表示；36 主区块 + 4 精修层、全原子 FAPE 损失；训练集约 12 万条蛋白—小分子结构。' },
  { id: 12, grp: 'en', doi: '10.1038/s41586-023-06415-8', q: 'De novo design of protein structure and function with RFdiffusion',
    t: 'Watson J L, Juergens D, Bennett N R, et al. De novo design of protein structure and function with RFdiffusion[J]. Nature, 2023, 620(7976): 1089-1100.',
    abs: '以 RoseTTAFold 作去噪网络做蛋白骨架生成：对称性、结合靶标与功能基序以坐标或掩码注入；100 残基设计在 A4000 上约 11 秒。' },
  { id: 13, grp: 'en', doi: '10.1126/science.ade2574', q: 'Evolutionary-scale prediction atomic-level protein structure language model',
    t: 'Lin Z, Akin H, Rao R, et al. Evolutionary-scale prediction of atomic-level protein structure with a language model[J]. Science, 2023, 379(6637): 1123-1130.',
    abs: 'ESM-2 从 8M 到 15B：困惑度 10.45 → 6.37，无需 MSA 即可提升长程接触与 TM-score；据此构建 6.17 亿条宏基因组的 ESM 图谱。' }
];
(function () {
  const list = document.getElementById('refList');
  if (!list) return;
  const tabs = document.querySelectorAll('#refTabs .tab');
  let grp = 'all';
  function render() {
    const key = (document.getElementById('q') && document.getElementById('q').value || '').trim().toLowerCase();
    list.innerHTML = '';
    REFS.filter(r => grp === 'all' || r.grp === grp)
      .filter(r => !key || (r.t + r.abs).toLowerCase().includes(key))
      .forEach(r => {
        const d = document.createElement('div');
        d.className = 'ref';
        let txt = r.t;
        if (key) txt = txt.replace(new RegExp('(' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
        const q = encodeURIComponent(r.q || r.t);
        const links = [];
        if (r.doi) links.push('<a href="https://doi.org/' + r.doi + '" target="_blank" rel="noopener">DOI / 原文</a>');
        if (r.grp === 'en') links.push('<a href="https://europepmc.org/search?query=' + encodeURIComponent('DOI:"' + (r.doi || '') + '"') + '" target="_blank" rel="noopener">Europe PMC 全文</a>');
        links.push('<a href="https://scholar.google.com/scholar?q=' + q + '" target="_blank" rel="noopener">学术搜索</a>');
        if (r.grp === 'cn') links.push('<a href="https://s.wanfangdata.com.cn/paper?q=' + q + '" target="_blank" rel="noopener">万方检索</a>');
        d.innerHTML = '<div class="head"><span class="no">[' + r.id + ']</span><div>' + txt +
          '<div class="ref-links">' + links.join('') + '</div></div></div><div class="abs">' + r.abs + '</div>';
        d.addEventListener('click', (e) => { if (e.target.closest('a')) return; d.classList.toggle('open'); });
        list.appendChild(d);
      });
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    grp = t.dataset.r;
    render();
  }));
  render();
  const q = document.getElementById('q');
  if (q) q.addEventListener('input', render);
})();

/* ---------- 自测（大型题库 + 随机抽题） ---------- */
const QUIZ_BANK = [
  { tag: '2.3', q: 'AlphaFold2 在 CASP14 上的中位主链误差（Cα r.m.s.d.）约为？', o: ['0.96 Å', '2.8 Å', '3.5 Å', '5.0 Å'], a: 0, f: '0.96 Å；当年次优方法约 2.8 Å，全原子精度约 1.5 Å（AF2）对 3.5 Å（次优）。' },
  { tag: '2.3', q: 'AlphaFold2 在 CASP14 的中位 GDT 分数约为？', o: ['72.4', '82.4', '92.4', '98.0'], a: 2, f: '中位 GDT 92.4，被视为“结构预测问题基本解决”的标志。' },
  { tag: '3.1', q: 'RoseTTAFold 的三条轨道不包括下列哪一项？', o: ['1D 序列 / MSA', '2D 距离与取向', '3D 原子坐标', '能量项'], a: 3, f: '三轨是 1D、2D、3D 表示；能量项属于传统物理方法或后续 pyRosetta 精修。' },
  { tag: '3.2', q: 'RFdiffusion 属于哪一类方法？', o: ['同源建模', '扩散生成模型', '分子动力学模拟', '密度图拟合'], a: 1, f: '以 RoseTTAFold 作去噪网络，从随机噪声反演生成新骨架。' },
  { tag: '2.2', q: '某区域 pLDDT 低于 50，合理的做法是？', o: ['直接当作结构证据', '只说明“可能存在”，需实验验证', '忽略整条序列', '用该值推断结合亲和力'], a: 1, f: '低置信度常对应无序区或错误折叠，只能作为假设。' },
  { tag: '4.2', q: 'ESMFold 相对基于 MSA 的方法，最关键的不同是？', o: ['必须依赖模板', '由单条序列直接推断，无需 MSA', '只能处理小于 100 残基的蛋白', '精度与 AF2 完全一致'], a: 1, f: '用蛋白质语言模型直接从单条序列推断全原子结构。' },
  { tag: '2.2', q: 'AlphaFold2 训练集中，来自 PDB 已知结构的比例约为？', o: ['25%', '50%', '75%', '90%'], a: 0, f: '约 25% 来自 PDB，75% 来自模型自身的高置信预测（自蒸馏）。' },
  { tag: '2.2', q: 'AlphaFold2 的 Evoformer 区块数量是？', o: ['12', '24', '48', '96'], a: 2, f: '48 个 Evoformer 区块 + 8 个结构模块，配合三轮回环。' },
  { tag: '2.2', q: 'AlphaFold2 的结构模块（Structure Module）个数是？', o: ['4', '8', '16', '32'], a: 1, f: '8 个结构模块，以等变注意力直接优化原子坐标。' },
  { tag: '2.2', q: 'AlphaFold2 的 recycling（循环迭代）默认轮数是？', o: ['1', '2', '3', '5'], a: 2, f: '默认三轮，把上一轮结构作为输入再次预测。' },
  { tag: '3.1', q: 'RoseTTAFold 预测 400 残基蛋白所需的显存约为？', o: ['约 4 GB', '约 8 GB', '约 16 GB', '约 24 GB'], a: 1, f: '约 8 GB；AlphaFold2 同规模约 24 GB。' },
  { tag: '3.1', q: 'RoseTTAFold 在单张 RTX2080 上预测 400 残基大约需要？', o: ['约 1 分钟', '约 10 分钟', '约 1 小时', '约 4 小时'], a: 1, f: '约 10 分钟；全原子精修另需 pyRosetta，约 1 小时 CPU。' },
  { tag: '3.2', q: 'RoseTTAFold 在 CASP14 的平均 TM-score 约为？', o: ['0.55', '0.65', '0.75', '0.85'], a: 2, f: '约 0.75，与 AlphaFold2 仍有差距，但在缺模板任务中稳定。' },
  { tag: '2.4', q: 'AlphaFold 蛋白质结构数据库（AFDB）目前公开的结构数量为？', o: ['约 20 万', '约 2000 万', '2 亿余条', '20 亿条'], a: 2, f: '2 亿余条，覆盖大量模式生物与人类蛋白组。' },
  { tag: '4.2', q: 'ESM 宏基因组图谱（ESM Metagenomic Atlas）包含多少条序列的结构预测？', o: ['6170 万', '1.2 亿', '6.17 亿', '61.7 亿'], a: 2, f: '超过 6.17 亿条，其中约 2.25 亿条为高置信度。' },
  { tag: '4.2', q: 'ESM-2 发布的最大参数规模是？', o: ['1.5 亿', '15 亿', '150 亿（15B）', '1500 亿'], a: 2, f: '15B 参数；困惑度由 8M 的 10.45 降至 6.37。' },
  { tag: '2.3', q: 'AlphaFold3 相比 AF2 新引入的核心模块是？', o: ['卷积网络', '扩散模块', '循环神经网络', '量子化学计算'], a: 1, f: '以扩散模块生成原子坐标，扩展到核酸、配体与共价修饰。' },
  { tag: '4.1', q: 'AF3 在抗原—抗体复合物任务中的成功率约为？', o: ['约 23%', '约 43%', '约 63%', '约 93%'], a: 2, f: '约 63%，且单次预测波动明显，需要多次采样。' },
  { tag: '3.2', q: 'RoseTTAFold All-Atom 的主区块数量是？', o: ['24', '36', '48', '64'], a: 1, f: '36 个主区块 + 4 个精修层。' },
  { tag: '3.2', q: 'RFdiffusion 生成 100 残基骨架在 A4000 上约需？', o: ['约 1 秒', '约 11 秒', '约 1 分钟', '约 10 分钟'], a: 1, f: '约 11 秒；对比 RFjoint inpainting 的确定性方法更快。' },
  { tag: '3.3', q: '论文中用 RoseTTAFold 作模板完成分子置换的蛋白不包括？', o: ['GLYAT', '细菌表层蛋白 SLP', '真菌蛋白 Lrbp', '肌红蛋白'], a: 3, f: '案例是 GLYAT、细菌氧化还原酶、SLP 与 Lrbp；肌红蛋白是 1958 年 X 射线的经典对象。' },
  { tag: '1.2', q: '冷冻电镜获得诺贝尔化学奖的年份是？', o: ['2002', '2009', '2017', '2020'], a: 2, f: '2017 年，表彰冷冻电镜在溶液态大分子结构解析中的贡献。' },
  { tag: '1.2', q: 'NMR 测定首个蛋白质结构（Wüthrich）大致在？', o: ['1965 年', '1975 年', '1985 年', '1995 年'], a: 2, f: '1985 年报道首个 NMR 蛋白质结构；2002 年获诺贝尔化学奖。' },
  { tag: '1.2', q: 'X 射线晶体学中，1958 年首次解析的蛋白是？', o: ['肌红蛋白', '血红蛋白四聚体', '胰岛素', '溶菌酶'], a: 0, f: '肌红蛋白（Kendrew）与血红蛋白（Perutz）同年，1962 年获诺贝尔化学奖。' },
  { tag: '1.3', q: '三类方法共同的瓶颈是？', o: ['都需要同步辐射', '都需要足量、均一的样品', '都需要同位素标记', '都需要液氮速冻'], a: 1, f: '样品制备是共同前提，这正是计算预测得以介入的起点。' },
  { tag: '4.1', q: '模型把无序区预测为紧凑折叠，这一偏差主要源于？', o: ['算力不足', '训练数据中无序区比例偏低', '损失函数写错', '输入序列太短'], a: 1, f: '训练数据以单体球状蛋白为主，无序区与复合物占比低。' },
  { tag: '4.4', q: 'AF3 未开放训练代码后，学界的反应是？', o: ['无人关注', '逾千名学者联署公开信', '立即被起诉', '期刊撤稿'], a: 1, f: '逾千名学者联署，质疑这与“可重复性”原则相悖。' },
  { tag: '2.2', q: 'pLDDT 与 PAE 分别描述？', o: ['全局精度与局部精度', '局部置信度与残基对相对不确定度', '两个都是实验误差', '两个都是训练损失'], a: 1, f: 'pLDDT 逐残基局部置信度；PAE 描述残基对之间相对位置的不确定度。' },
  { tag: '3.1', q: '三轨模型与双轨模型的关键差别在于？', o: ['参数量更大', '坐标在中间层持续参与更新', '使用更多 GPU', '训练数据不同'], a: 1, f: '差别在信息流方向：三轨让 3D 坐标在每一层参与，而不是末端才推理。' },
  { tag: '2.1', q: 'CASP 盲测体系开始于哪一年？', o: ['1973', '1994', '2018', '2020'], a: 1, f: '1994 年首届 CASP，用未发表靶标做盲测，建立可比基准。' },
  { tag: '2.3', q: 'AlphaFold1 在 CASP13 的核心思路是？', o: ['端到端坐标回归', '预测残基间距离图再做优化', '纯同源建模', '分子动力学采样'], a: 1, f: '以深度残差网络预测残基间距离，再用优化求解结构，尚未端到端。' },
  { tag: '4.3', q: '下列哪一项不是本报告列出的未来方向？', o: ['从头设计', '动态构象与系综', '摆脱 MSA 依赖', '彻底取消实验验证'], a: 3, f: '预测改变的是结构解析的起点，而非终点；实验验证仍是必要环节。' }
];

const PICK = 6;
let current = [];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

(function () {
  const box = document.getElementById('quizBox');
  if (!box) return;
  const btnCheck = document.getElementById('quizCheck');
  const btnReset = document.getElementById('quizReset');
  const scoreEl = document.getElementById('quizScore');

  // 顶部工具条
  const bar = document.createElement('div');
  bar.className = 'quiz-bar';
  bar.innerHTML = '<span class="pill" id="qRound">第 1 组</span>' +
    '<span class="pill" id="qCount">0 / ' + PICK + '</span>' +
    '<div class="quiz-progress"><i id="qProg"></i></div>' +
    '<span style="font-size:12px;color:var(--muted)">题库 ' + QUIZ_BANK.length + ' 题，每次随机 ' + PICK + ' 题</span>';
  box.parentNode.insertBefore(bar, box);
  const card = document.createElement('div');
  card.className = 'result-card';
  card.id = 'quizCard';
  box.parentNode.insertBefore(card, box.nextSibling);

  let round = 1;

  function render() {
    current = shuffle(QUIZ_BANK).slice(0, PICK);
    box.innerHTML = '';
    current.forEach((it, qi) => {
      const d = document.createElement('div');
      d.className = 'q';
      d.dataset.qi = qi;
      let html = '<div class="tagline">' + it.tag + '</div><h4>' + (qi + 1) + '. ' + it.q + '</h4>';
      it.o.forEach((o, oi) => {
        html += '<label class="opt" data-o="' + oi + '">' + String.fromCharCode(65 + oi) + '．' + o + '</label>';
      });
      html += '<div class="fb"></div>';
      d.innerHTML = html;
      d.querySelectorAll('.opt').forEach(op => op.addEventListener('click', () => {
        if (d.classList.contains('done')) return;
        d.querySelectorAll('.opt').forEach(x => x.classList.remove('pick'));
        op.classList.add('pick');
        const n = box.querySelectorAll('.opt.pick').length;
        document.getElementById('qCount').textContent = n + ' / ' + PICK;
        document.getElementById('qProg').style.width = (n / PICK * 100) + '%';
      }));
      box.appendChild(d);
    });
    document.getElementById('qRound').textContent = '第 ' + round + ' 组';
    document.getElementById('qCount').textContent = '0 / ' + PICK;
    document.getElementById('qProg').style.width = '0%';
    scoreEl.textContent = '';
    card.classList.remove('show');
    card.innerHTML = '';
  }

  if (btnCheck) btnCheck.addEventListener('click', () => {
    let score = 0;
    box.querySelectorAll('.q').forEach(d => {
      const it = current[+d.dataset.qi];
      const pick = d.querySelector('.opt.pick');
      d.classList.add('done');
      d.querySelectorAll('.opt').forEach((op, oi) => {
        op.classList.toggle('right', oi === it.a);
        op.classList.toggle('wrong', !!pick && op === pick && oi !== it.a);
      });
      const ok = pick && +pick.dataset.o === it.a;
      d.querySelector('.fb').innerHTML = (ok ? '<span style="color:#1d8a5a">✔ 正确。</span> '
        : '<span style="color:#b3403f">✘ 正确答案：' + String.fromCharCode(65 + it.a) + '。</span> ') + it.f;
      if (ok) score++;
    });
    const pct = Math.round(score / current.length * 100);
    scoreEl.textContent = '得分：' + score + ' / ' + current.length;
    document.getElementById('qProg').style.width = '100%';
    card.classList.add('show');
    card.innerHTML = '<div style="font-size:13px;color:var(--muted);letter-spacing:1px">本组得分</div>' +
      '<b>' + score + ' / ' + current.length + '</b><span style="color:var(--muted);margin-left:10px">正确率 ' + pct + '%</span>' +
      '<div style="margin-top:8px;font-size:13.5px;color:var(--body)">' +
      (pct >= 85 ? '很稳：关键数字与判断边界都掌握了。'
        : pct >= 60 ? '基本掌握；建议回看标红的题目对应小节。'
        : '建议重读 2.2、3.1 与 4.2 三节，再来一组。') + '</div>' +
      '<button class="btn primary" style="margin-top:12px" onclick="document.getElementById(\'quizReset\').click()">换一组题 →</button>';
  });

  if (btnReset) btnReset.addEventListener('click', () => { round++; render(); });

  render();
})();
