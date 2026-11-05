/* ============ 站点核心：进度、导航、滚动显现、搜索 ============ */
document.body.classList.add('js');

/* ---------- 阅读进度条 ---------- */
const prog = document.getElementById('progress');
function paintProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  if (prog) prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
}
document.addEventListener('scroll', paintProgress, { passive: true });
paintProgress();

/* ---------- 滚动逐一显现 ---------- */
(function () {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const el = en.target;
        const delay = (+el.dataset.delay || 0);
        setTimeout(() => el.classList.add('in'), delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el, i) => {
    // 同一屏内的元素依次出现
    if (!el.dataset.delay) el.dataset.delay = String((i % 4) * 70);
    io.observe(el);
  });
})();

/* ---------- 右侧小节导航 + 章节圆点 ---------- */
(function () {
  const rail = [...document.querySelectorAll('.rail a[href^="#"]')];
  const secs = rail.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const dots = document.getElementById('dots');
  function spy() {
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= 140) cur = i; });
    rail.forEach((a, i) => a.classList.toggle('on', i === cur));
    if (dots) [...dots.children].forEach((b, i) => b.classList.toggle('on', i === cur));
  }
  document.addEventListener('scroll', spy, { passive: true });
  spy();
})();

/* ---------- 顶栏当前页高亮 ---------- */
(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('header.top nav.main a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here || (here === 'index.html' && href === './')) a.classList.add('on');
  });
})();

/* ---------- 键盘：J/K 或 ↑/↓ 跳小节 ---------- */
(function () {
  const anchors = [...document.querySelectorAll('.rail a[href^="#"]')];
  if (!anchors.length) return;
  document.addEventListener('keydown', e => {
    if (/input|textarea/i.test(e.target.tagName)) return;
    let idx = anchors.findIndex(a => a.classList.contains('on'));
    if (e.key === 'j' || e.key === 'PageDown' && e.altKey) { e.preventDefault(); (anchors[idx + 1] || anchors[0]).click(); }
    if (e.key === 'k' || e.key === 'PageUp' && e.altKey) { e.preventDefault(); (anchors[Math.max(0, idx - 1)]).click(); }
  });
})();

/* ---------- 站内搜索 ---------- */
const INDEX = [
  ['index.html', '首页 · 关键数字与章节导览', 'hero', '92.4 GDT，0.96 Å 主链误差，2 亿条结构，6.17 亿条序列'],
  ['ch1.html', '1.1 蛋白质结构的意义', 's11', '酶、抗体、激素、疫苗；结构决定功能；无序蛋白的边界'],
  ['ch1.html', '1.1 解析的困难', 's11', '层级、修饰、样品、环境；通量瓶颈；PDB 结构数量'],
  ['ch1.html', '1.2 三类实验方法', 's12', 'X 射线晶体衍射、核磁共振 NMR、冷冻电镜 Cryo-EM 的原理与局限'],
  ['ch1.html', '1.3 方法比较与共同瓶颈', 's13', '分辨率、样品要求、适用对象对照表；必须先获得足量均一样品'],
  ['ch2.html', '2.1 预测问题的由来', 's21', 'Anfinsen 法则、CASP 盲测、同源建模、距离图与深度学习'],
  ['ch2.html', '2.2 AlphaFold2 架构', 's22', 'Evoformer 双轨表示、结构模块、48 区块、8 模块、recycling'],
  ['ch2.html', '2.2 MSA 与共演化', 's22', '多序列比对、协变信号、长程接触、MSA 深度与精度'],
  ['ch2.html', '2.2 数据库与训练数据', 's22', 'PDB 约 17 万条训练结构、pLDDT 与 PAE、自蒸馏 25/75'],
  ['ch2.html', '2.2 pLDDT 判读器', 's22', '置信度阈值 90 / 70 / 50；低置信区域不能当结论'],
  ['ch2.html', '2.3 发展与版本演进', 's23', 'CASP14 92.4 GDT、0.96 Å、AF2-Multimer、AF3、AlphaFold DB'],
  ['ch2.html', '2.4 应用', 's24', '分子置换模板、电镜密度图拟合、口袋分析、虚拟筛选、数据库检索'],
  ['ch3.html', '3.1 RoseTTAFold 原理', 's31', '三轨网络 1D/2D/3D、SE(3)-Transformer、信息流方向'],
  ['ch3.html', '3.1 训练与推理成本', 's31', '260 残基截断、RTX2080 约 10 分钟、8 GB 显存、pyRosetta 精修'],
  ['ch3.html', '3.2 RFdiffusion 设计', 's32', '扩散模型、去噪、对称寡聚体、结合蛋白、基序支架、ProteinMPNN'],
  ['ch3.html', '3.2 RoseTTAFold All-Atom', 's32', '核酸、金属、小分子、共价修饰；原子图表示；36 主区块 + 4 精修层'],
  ['ch3.html', '3.3 应用案例', 's33', 'GLYAT、SLP、Lrbp 分子置换；PI3Kγ；TANGO2、ADAM33、CERS1 突变'],
  ['ch3.html', '3.4 与 AlphaFold 的技术对照', 's34', '信息流、推理成本、CASP14、能力扩展、开放程度'],
  ['ch4.html', '4.1 尚未解决的问题', 's41', '复合物界面、无序区、侧链与配体、评估与验证'],
  ['ch4.html', '4.2 语言模型 ESM', 's42', '8M 到 15B、困惑度 10.45 到 6.37、6.17 亿条宏基因组'],
  ['ch4.html', '4.3 未来方向', 's43', '从头设计、动态构象、摆脱 MSA、AI 与实验闭环、可及性'],
  ['ch4.html', '4.4 科学与社会', 's44', '开放与可重复、学术与产业、双重用途与生物安全、教育与普及'],
  ['references.html', '参考文献', 'refs', '徐甲强、郭贝一、孙雨楠、张弘、宫维斌、车禹萱、朱吕帅、Jumper、Baek、Abramson、Krishna、Watson、Lin'],
  ['quiz.html', '自测题', 'quiz', 'CASP14 数字、三轨、RFdiffusion、pLDDT 判读、ESMFold']
];

(function () {
  const input = document.getElementById('q');
  const box = document.getElementById('hits');
  if (!input || !box) return;

  function renderHits(list, key) {
    if (!key) { box.classList.remove('show'); box.innerHTML = ''; return; }
    if (!list.length) {
      box.innerHTML = '<div class="none">没有匹配的内容，试试 “CASP”“pLDDT”“RFdiffusion”。</div>';
      box.classList.add('show');
      return;
    }
    box.innerHTML = list.slice(0, 9).map(([page, title, anchor, text]) => {
      const hi = (s) => s.replace(new RegExp('(' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
      return '<a href="' + page + '#' + anchor + '"><b>' + hi(title) + '</b><span>' + hi(text.slice(0, 84)) + '</span></a>';
    }).join('');
    box.classList.add('show');
  }

  function search() {
    const key = input.value.trim().toLowerCase();
    if (!key) return renderHits([], '');
    const list = INDEX.filter(e => (e[1] + ' ' + e[3]).toLowerCase().includes(key));
    renderHits(list, key);
  }
  input.addEventListener('input', search);
  input.addEventListener('focus', search);
  document.addEventListener('click', e => {
    if (!box.contains(e.target) && e.target !== input) box.classList.remove('show');
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = box.querySelector('a');
      if (first) location.href = first.getAttribute('href');
    }
    if (e.key === 'Escape') { box.classList.remove('show'); input.blur(); }
  });
  // 快捷键 “/” 聚焦搜索
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); input.focus(); }
  });
})();

/* ============ 移动端菜单 / 回顶按钮 / 进度百分比 ============ */
(function () {
  const btn = document.getElementById('menuBtn');
  const nav = document.querySelector('header.top nav.main');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); btn.textContent = '☰'; btn.setAttribute('aria-expanded', 'false');
    }));
  }
  const fab = document.getElementById('fab');
  const pct = document.getElementById('pct');
  function upd() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    if (fab) fab.classList.toggle('show', h.scrollTop > 600);
    if (pct) pct.textContent = Math.round(p * 100) + '%';
  }
  document.addEventListener('scroll', upd, { passive: true });
  upd();
  if (fab) fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
