/* ============ 3.2.2 自动演示 / 阶段导航 / 序列输出；3.2.3 全原子表示 ============ */
(function () {
  function init() {
    /* ---------- 3.2.2 ---------- */
    const slider = document.getElementById('denoise');
    const playBtn = document.getElementById('dnPlay');
    const stages = document.querySelectorAll('.dn-stage');
    const panel = document.getElementById('dnPanel');
    const seqCode = document.getElementById('dnSeqCode');

    const STAGE = [
      { t: 0, name: '① 纯噪声', text: '从标准高斯噪声起步：每个残基的坐标与取向都是随机的，此时不存在任何结构信息。' },
      { t: 0.35, name: '② 骨架雏形', text: '去噪网络反复预测“这一步的噪声”，坐标逐渐聚拢，出现链的走向与粗略的二级结构倾向。' },
      { t: 0.75, name: '③ 可折叠', text: '局部几何基本成立：主链键长键角、手性、无自交叠；条件（对称、靶标界面、功能基序）在此阶段被满足。' },
      { t: 1, name: '④ 交给 MPNN', text: '骨架确定后反转问题：固定骨架，用 ProteinMPNN 设计能折叠成该骨架的氨基酸序列，再交由实验验证。' }
    ];
    const AA = 'GSHMKEVLAQRTWYPDNFIC';

    function paintStage(t) {
      let idx = 0;
      STAGE.forEach((s, i) => { if (t >= s.t - 0.02) idx = i; });
      stages.forEach((b, i) => b.classList.toggle('on', i === idx));
      if (panel) panel.innerHTML = '<b>' + STAGE[idx].name + '</b><span>' + STAGE[idx].text + '</span>';
      if (seqCode) {
        const n = Math.max(0, Math.round((t - 0.55) / 0.45 * AA.length));
        seqCode.textContent = n > 1 ? AA.slice(0, n) + '…' : '— — —';
        seqCode.style.opacity = n > 1 ? '1' : '.45';
      }
    }

    if (slider) {
      slider.addEventListener('input', () => paintStage(+slider.value / 100));
      paintStage(+slider.value / 100);
    }
    stages.forEach(b => b.addEventListener('click', () => {
      const v = Math.round(+b.dataset.t * 100);
      if (slider) { slider.value = v; slider.dispatchEvent(new Event('input')); }
      paintStage(+b.dataset.t);
    }));

    let playing = 0;
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (playing) { cancelAnimationFrame(playing); playing = 0; playBtn.textContent = '▶ 自动演示'; return; }
        playBtn.textContent = '❚❚ 暂停';
        let t0 = null;
        const from = slider ? +slider.value / 100 : 0;
        const dur = 5200;
        function step(ts) {
          if (!t0) t0 = ts;
          const k = Math.min(1, (ts - t0) / dur);
          const t = from + (1 - from) * k;
          if (slider) { slider.value = Math.round(t * 100); slider.dispatchEvent(new Event('input')); }
          if (k < 1) {
            playing = requestAnimationFrame(step);
          } else {
            playing = 0;
            if (playBtn) playBtn.textContent = '▶ 自动演示';
          }
        }
        playing = requestAnimationFrame(step);
      });
    }

    /* ---------- 3.2.3 全原子表示 ---------- */
    const box = document.getElementById('aaRep');
    if (!box) return;
    const body = document.getElementById('aaBody');
    const countEl = document.getElementById('aaCount');

    const REP = {
      1: {
        name: '1D 编码：元素类型',
        text: '每个原子（或残基/碱基）得到一个向量，说明它是碳、氮、氧、硫还是金属离子——蛋白残基、核酸碱基与配体原子共用同一套 1D 词表。'
      },
      2: {
        name: '2D 编码：化学键',
        text: '以原子对为轴，编码共价键的存在与类型；蛋白—配体、蛋白—金属之间的连接因此可以和主链一起被表示。'
      },
      3: {
        name: '3D 编码：手性',
        text: '在键的基础上加入局部几何：四面体手性、键长键角与相对取向，让网络能区分对映体与研究构象。'
      }
    };

    const PARTS = {
      protein: { label: '蛋白', atoms: 1024, desc: '1 条链 · 128 残基' },
      nucleic: { label: '核酸', atoms: 0, desc: '本例不含核酸' },
      ligand: { label: '配体', atoms: 24, desc: '1 个小分子 · 24 个重原子' },
      metal: { label: '金属离子', atoms: 2, desc: '2 个 Zn²⁺' }
    };
    const active = { protein: true, nucleic: false, ligand: true, metal: true };
    let rep = 1;

    function render() {
      body.innerHTML = '<div class="aa-name">' + REP[rep].name + '</div><p>' + REP[rep].text + '</p>' +
        '<div class="aa-vis">' + visual() + '</div>';
      let total = 0, parts = [];
      Object.keys(active).forEach(k => {
        if (!active[k] || !PARTS[k].atoms) return;
        total += PARTS[k].atoms;
        parts.push(PARTS[k].label + ' ' + PARTS[k].atoms);
      });
      countEl.innerHTML = '<b>体系规模（示意）：' + total.toLocaleString() + ' 个原子</b><span>' +
        (parts.length ? parts.join(' · ') : '未选择组分') + '</span>';
    }

    function visual() {
      // 简化图示：1D 一串方块；2D 方块之间连线；3D 附加立体楔形
      const cols = ['#2a86cf', '#117f86', '#c9801d', '#7a5cc4', '#b3403f'];
      let s = '<svg viewBox="0 0 420 96" class="aa-svg">';
      for (let i = 0; i < 9; i++) {
        const x = 16 + i * 44, c = cols[i % cols.length];
        if (rep >= 2 && i > 0) {
          s += '<line x1="' + (x - 26) + '" y1="48" x2="' + (x - 6) + '" y2="48" stroke="#c3d2e4" stroke-width="2"/>';
        }
        s += '<rect x="' + x + '" y="38" width="20" height="20" rx="5" fill="' + c + '" opacity="' + (rep === 1 ? 1 : .82) + '"/>';
        if (rep === 3) {
          s += '<path d="M' + (x + 10) + ' 38 l0 -14 l10 7 z" fill="' + c + '" opacity=".55"/>';
        }
      }
      s += '</svg>';
      return s;
    }

    box.querySelectorAll('.aa-tab').forEach(b => b.addEventListener('click', () => {
      box.querySelectorAll('.aa-tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      rep = +b.dataset.r;
      render();
    }));
    box.querySelectorAll('.aa-chip').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.c;
      active[k] = !active[k];
      b.classList.toggle('on', active[k]);
      render();
    }));
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
