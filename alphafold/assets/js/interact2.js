/* ============ 形象化组件：架构分步、版本演进、双轨/三轨切换 ============ */
(function () {
  function init() {
    /* ---------- 2.2 架构分步器 ---------- */
    (function () {
      const box = document.getElementById('archStepper');
      if (!box) return;
      const body = document.getElementById('archBody');
      const STAGES = [
        {
          t: '输入：序列与 MSA',
          rows: [
            ['输入', '目标序列；可选模板结构；经数据库检索得到 MSA（多序列比对）。'],
            ['输出', 'MSA 表示（s, r, c）与配对表示（r, r, c）的初始张量。'],
            ['关键点', 'MSA 深度决定共变信号强弱：同源序列越多，远距离接触约束越可靠。']
          ]
        },
        {
          t: 'Evoformer × 48',
          rows: [
            ['做什么', '交替更新两条表示：MSA 行/列注意力 + 三角形乘法/注意力 + 外积平均。'],
            ['输出', '经过 48 个区块后，MSA 与配对表示都携带几何与进化信息。'],
            ['关键点', '这是 AlphaFold2 的核心：让“进化信息”与“几何约束”在一个网络里互相修正。']
          ]
        },
        {
          t: '配对表示 (r, r, c)',
          rows: [
            ['是什么', '以残基对为轴，编码距离分布与相对取向，是结构模块的直接输入。'],
            ['输出', '残基对的距离/取向特征，供等变注意力转成三维几何。'],
            ['关键点', '配对表示是“2D 到 3D”的桥梁；RoseTTAFold 的三轨则让它与坐标并行更新。']
          ]
        },
        {
          t: '结构模块 × 8',
          rows: [
            ['做什么', '以等变注意力（IPA）在配对表示的约束下更新骨架与侧链框架。'],
            ['输出', '主链原子坐标，以及逐残基 pLDDT。'],
            ['关键点', '每一轮 recycling 都把上一轮坐标作为输入，使序列、距离与坐标逐步自洽。']
          ]
        },
        {
          t: '输出：坐标与置信度',
          rows: [
            ['输出', '全原子坐标、pLDDT（逐残基）、PAE（残基对）。'],
            ['怎么用', '先看 pLDDT 判断哪些区域可信，再看 PAE 判断相对位置是否可靠。'],
            ['关键点', '模型给出的是“带置信度的假设”，低置信区域必须实验验证。']
          ]
        }
      ];
      function render(i) {
        const s = STAGES[i];
        body.innerHTML = '<div class="stage-name">' + s.t + '</div>' +
          s.rows.map(r => '<div class="stage-row"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>').join('');
      }
      box.querySelectorAll('.stage').forEach(btn => {
        btn.addEventListener('click', () => {
          box.querySelectorAll('.stage').forEach(b => b.classList.remove('on'));
          btn.classList.add('on');
          render(+btn.dataset.s);
        });
      });
      render(0);
    })();

    /* ---------- 2.3 版本演进 ---------- */
    (function () {
      const wrap = document.getElementById('verStep');
      if (!wrap) return;
      const body = document.getElementById('verBody');
      const VER = [
        { n: 'AlphaFold1', y: '2018', cas: 'CASP13：领先', rows: [
          ['思路', '深度残差网络预测残基间距离分布，再用优化求解结构。'],
          ['成果', 'CASP13 上明显领先，但尚未端到端。'],
          ['局限', '依赖手工特征与后处理，距离图到结构仍靠优化。']] },
        { n: 'AlphaFold2', y: '2020', cas: 'CASP14：GDT 92.4', rows: [
          ['架构', 'Evoformer 双轨 + 结构模块 + 三轮 recycling。'],
          ['数据', '约 17 万条 PDB 链，配合自蒸馏（25% / 75%）。'],
          ['局限', '单体为主；复合物、配体与无序区仍是短板。']] },
        { n: 'AF2-Multimer', y: '2021', cas: '复合物：改善但不稳定', rows: [
          ['能力', '面向蛋白—蛋白复合物，界面接触预测有所提升。'],
          ['问题', '界面构象与链间相对取向波动大，需要多模型采样。'],
          ['定位', 'AF2 的延伸，而非独立架构。']] },
        { n: 'AlphaFold3', y: '2024', cas: '核酸 / 配体 / 修饰', rows: [
          ['架构', '以扩散模块生成原子坐标，替代结构模块。'],
          ['能力', '蛋白—核酸、蛋白—配体、共价修饰。'],
          ['争议', '未开放训练代码，引发开放性讨论；抗体任务成功率约 63%。']] }
      ];
      function render(i) {
        const v = VER[i];
        body.innerHTML = '<div class="vname">' + v.n + '<span>' + v.y + '</span><em>' + v.cas + '</em></div>' +
          v.rows.map(r => '<div class="stage-row"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>').join('');
      }
      document.querySelectorAll('#verBtns .vbtn').forEach(b => {
        b.addEventListener('click', () => {
          document.querySelectorAll('#verBtns .vbtn').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          render(+b.dataset.v);
        });
      });
      render(1);
    })();

    /* ---------- 3.1 双轨 / 三轨切换 ---------- */
    (function () {
      const svg = document.getElementById('trackSvg');
      const box = document.querySelector('.track-toggle');
      if (!svg || !box) return;
      const note = document.getElementById('trackNote');
      const flow3d = document.getElementById('flow3d');
      const loops = ['loop1', 'loop2', 'loopLabel'].map(id => document.getElementById(id));

      const TEXT = {
        three: '三轨：坐标在每一层都参与更新，序列、距离与坐标相互约束——这是 RoseTTAFold 与双轨模型的关键差异。',
        two: '双轨（示意）：结构模块要等 1D 与 2D 表示处理完毕后才推理坐标，3D 不参与中间层更新，因此需要更长的网络与更多的算力来弥补。'
      };

      function setMode(mode) {
        box.querySelectorAll('.tt').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        svg.classList.toggle('two-track', mode === 'two');
        if (flow3d) flow3d.style.opacity = mode === 'two' ? '0.12' : '';
        loops.forEach(el => { if (el) el.style.opacity = mode === 'two' ? '0' : ''; });
        if (note) note.textContent = TEXT[mode];
      }
      box.querySelectorAll('.tt').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
