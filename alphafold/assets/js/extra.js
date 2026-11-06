/* ============ 附加交互：灯箱 / 方法选择器 / 术语提示 / MSA 深度 / 表格说明 ============ */
(function () {
  function init() {
    /* ---------- 图片灯箱（ch1 缩略图） ---------- */
    (function () {
      const lb = document.getElementById('lightbox');
      const thumbs = document.querySelectorAll('.thumb');
      if (!lb || !thumbs.length) return;
      const img = document.getElementById('lbImg');
      const cap = document.getElementById('lbCap');
      function open(src, text) {
        img.src = src;
        cap.textContent = text || '';
        lb.classList.add('show');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
      function close() {
        lb.classList.remove('show');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      thumbs.forEach(t => t.addEventListener('click', () => open(t.dataset.src, t.dataset.cap)));
      document.querySelectorAll('.open-orig').forEach(a => a.addEventListener('click', ev => {
        ev.preventDefault(); open(a.dataset.src, a.dataset.cap);
      }));
      lb.addEventListener('click', close);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    })();

    /* ---------- 1.2 方法选择器 ---------- */
    (function () {
      const go = document.getElementById('pkGo');
      if (!go) return;
      const out = document.getElementById('pkOut');
      const sample = document.getElementById('pkSample');
      const goal = document.getElementById('pkGoal');

      const RULES = {
        crystal: {
          res: ['X 射线晶体衍射', '分辨率最高、模型最完整，PDB 中多数结构来自晶体学。', '需要长出高质量晶体；柔性区与构象可能受晶格堆积影响。'],
          native: ['X 射线晶体衍射 + 冷冻电镜补充', '晶体给出高分辨率基准，电镜用于验证近生理状态。', '晶体构象未必等于溶液构象。'],
          dyn: ['NMR（若分子量合适）', '溶液态可给出构象系综与动态信息。', '分子量上限明显，谱峰重叠严重。'],
          fast: ['冷冻电镜', '无需结晶，样品制备周期短。', '分辨率与样品均一性密切相关。']
        },
        membrane: {
          res: ['冷冻电镜', '膜蛋白与大复合物的主流方法，近生理状态、无需结晶。', '样品与设备门槛高，数据处理复杂。'],
          native: ['冷冻电镜', '速冻包埋于玻璃态冰，接近天然构象。', '仍受去垢剂/脂环境选择影响。'],
          dyn: ['冷冻电镜 + NMR 补充', '电镜给整体构象，NMR 给局部动态。', '联用成本高。'],
          fast: ['冷冻电镜', '无需结晶，直接成像。', '数据量巨大。']
        },
        small: {
          res: ['X 射线晶体衍射', '小分子量蛋白晶体学成熟，分辨率高。', '需筛选结晶条件。'],
          native: ['NMR', '溶液态、无损，适合小分子量可溶蛋白。', '谱峰重叠，常需同位素标记。'],
          dyn: ['NMR', '可刻画构象交换与动态。', '常规分子量上限约 30 kDa。'],
          fast: ['NMR', '无需结晶，样品用量少。', '数据解析周期长。']
        },
        flex: {
          res: ['X 射线晶体衍射（稳定核心）+ 预测模型补全', '晶体给出稳定核心，柔性区用预测或 NMR 补充。', '柔性区难以结晶，模型可能高估有序性。'],
          native: ['冷冻电镜（多构象分类）', '可对同一体系做构象分类，得到多个状态。', '分辨率通常低于晶体。'],
          dyn: ['NMR', '能直接给出构象系综与交换速率。', '分子量受限，需较高浓度。'],
          fast: ['冷冻电镜', '无需结晶、可直接看到不均一性。', '样品量需求较大。']
        }
      };

      go.addEventListener('click', () => {
        const r = (RULES[sample.value] || {})[goal.value];
        if (!r) return;
        out.innerHTML = '<div class="pk-method">' + r[0] + '</div>' +
          '<div class="pk-why"><b>理由：</b>' + r[1] + '</div>' +
          '<div class="pk-warn"><b>注意：</b>' + r[2] + '</div>';
      });
    })();

    /* ---------- 术语提示（data-term） ---------- */
    (function () {
      const GLOSS = {
        'MSA': '多序列比对：把同源蛋白的序列对齐，用于提取共变信号。',
        'pLDDT': '模型自评的局部置信度（0–100），不是实验精度。',
        'PAE': '预测对齐误差：残基对之间的相对位置不确定度。',
        'Evoformer': 'AlphaFold2 的双轨表示模块，交替更新 MSA 与残基对。',
        'recycling': '循环迭代：把上一轮结构作为输入再次预测。',
        '自蒸馏': '用模型自己的高置信预测扩充训练集。',
        'CASP': '两年一届的结构预测盲测评估。',
        'TM-score': '衡量两个结构整体相似度的指标（0–1）。',
        '分子置换': '用已知同源结构作模板解决晶体相位问题。',
        'FAPE': '帧对齐点误差：AlphaFold 系列的结构损失函数。'
      };
      document.querySelectorAll('[data-term]').forEach(el => {
        const text = GLOSS[el.dataset.term];
        if (!text) return;
        el.classList.add('gloss');
        const tip = document.createElement('span');
        tip.className = 'gloss-tip';
        tip.textContent = text;
        el.appendChild(tip);
      });
    })();

    /* ---------- 2.2 MSA 深度 → 长程接触精度 ---------- */
    (function () {
      const s = document.getElementById('msaDepth');
      if (!s) return;
      const out = document.getElementById('msaDepthOut');
      const bar = document.getElementById('msaBar');
      const note = document.getElementById('msaNote');
      const accEl = document.getElementById('msaAcc');
      const DEPTH = [1, 5, 20, 50, 100, 300, 1000, 3000, 10000];
      const ACC = [0.18, 0.30, 0.42, 0.50, 0.56, 0.62, 0.68, 0.72, 0.75];
      function paint() {
        const i = +s.value;
        const d = DEPTH[i], a = ACC[i];
        out.textContent = d >= 1000 ? (d / 1000) + 'k 条' : d + ' 条';
        bar.style.width = Math.round(a * 100) + '%';
        if (accEl) accEl.textContent = Math.round(a * 100) + '%';
        if (note) {
          note.textContent = a < 0.35 ? '同源序列太少，只靠 MSA 几乎无法确定折叠。'
            : a < 0.55 ? '信号有限，需要模板或多方法交叉验证。'
            : a < 0.68 ? '多数球状蛋白可得到可信的折叠。'
            : '共变信号充分，通常接近单结构域精度上限。';
        }
      }
      s.addEventListener('input', paint);
      paint();
    })();

    /* ---------- 3.4 对照表：点击行展开说明 ---------- */
    (function () {
      const rows = document.querySelectorAll('table.cmp tbody tr[data-note]');
      if (!rows.length) return;
      rows.forEach(tr => {
        tr.classList.add('rownote');
        const tr2 = document.createElement('tr');
        tr2.className = 'note-row';
        const td = document.createElement('td');
        td.className = 'note-cell';
        td.colSpan = tr.children.length;
        td.innerHTML = '<div class="row-note">' + tr.dataset.note + '</div>';
        tr2.appendChild(td);
        tr.after(tr2);
        tr.addEventListener('click', () => {
          tr.classList.toggle('open');
          tr2.classList.toggle('show');
        });
      });
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
