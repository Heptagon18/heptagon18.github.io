/* ============ 文献角标弹窗（sup.cite → 参考文献卡片） ============ */
(function () {
  function init() {
    const cites = [...document.querySelectorAll('sup.cite')];
    if (!cites.length) return;
    const bank = (typeof REFS !== 'undefined' && Array.isArray(REFS)) ? REFS : null;
    if (!bank) return;

    const pop = document.createElement('div');
    pop.id = 'citePop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', '文献引用');
    document.body.appendChild(pop);

    let current = null;   // 当前角标
    let pinned = false;   // 点击后固定
    let leaveTimer = null;
    let overPop = false;

    function refOf(n) { return bank.find(r => r.id === n); }

    function titleOf(ref) {
      // "作者. 标题[J]. 期刊, 年, 卷(期): 页." → 拆成 标题 / 出处
      const s = ref.t;
      const cut = s.indexOf('[J]');
      if (cut < 0) return { main: s, meta: '' };
      const head = s.slice(0, cut);
      const tail = s.slice(cut + 3).replace(/^[.\s]+/, '');
      const dot = head.indexOf('. ');
      const title = dot >= 0 ? head.slice(dot + 2) : head;
      const authors = dot >= 0 ? head.slice(0, dot) : '';
      return { main: title, meta: (authors ? authors + '　' : '') + tail };
    }

    function build(nums) {
      const items = nums.map(n => {
        const r = refOf(n);
        if (!r) return '';
        const t = titleOf(r);
        return '<div class="cp-item"><span class="no">[' + n + ']</span><div class="txt">' +
          t.main + '<i>' + t.meta + '</i></div></div>';
      }).join('');
      const first = nums[0];
      const doi = refOf(first) && refOf(first).doi;
      return '<div class="cp-head"><span>文献引用 <b>' + nums.map(n => '[' + n + ']').join(' ') +
        '</b></span><button class="cp-close" aria-label="关闭">✕</button></div>' +
        items +
        '<div class="cp-foot">' +
        '<a href="references.html' + (nums.length === 1 ? '#ref-' + first : '') + '">在文献页查看 →</a>' +
        (doi ? '<a href="https://doi.org/' + doi + '" target="_blank" rel="noopener">DOI 原文 ↗</a>' : '') +
        '<a href="references.html">全部 13 条</a><span style="margin-left:auto;color:var(--muted)">悬停查看 · 点击固定</span>' +
        '</div>';
    }

    pop.addEventListener('mouseenter', () => { overPop = true; clearTimeout(leaveTimer); });
    pop.addEventListener('mouseleave', () => { overPop = false; if (!pinned) hide(); });

    function place(el) {
      const r = el.getBoundingClientRect();
      const pr = pop.getBoundingClientRect();
      let left = r.left + r.width / 2 - pr.width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - pr.width - 12));
      let top = r.top - pr.height - 10;
      if (top < 8) top = r.bottom + 10;
      pop.style.left = Math.round(left) + 'px';
      pop.style.top = Math.round(top) + 'px';
    }

    function show(el) {
      current = el;
      const nums = (el.textContent.match(/\d+/g) || []).map(Number);
      if (!nums.length) return;
      pop.innerHTML = build(nums);
      pop.querySelector('.cp-close').addEventListener('click', e => { e.stopPropagation(); hide(true); });
      pop.querySelectorAll('a').forEach(a => a.addEventListener('click', () => hide(true)));
      pop.classList.add('show');
      place(el);
      el.classList.add('pinned');
    }

    function hide(force) {
      if (pinned && !force) return;
      current = null;
      pinned = false;
      pop.classList.remove('show');
      cites.forEach(c => c.classList.remove('pinned'));
    }

    cites.forEach(el => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-haspopup', 'dialog');
      el.addEventListener('mouseenter', () => { clearTimeout(leaveTimer); if (!pinned) show(el); });
      el.addEventListener('mouseleave', () => { leaveTimer = setTimeout(() => { if (!pinned && !overPop) hide(); }, 260); });
      el.addEventListener('focus', () => { if (!pinned) show(el); });
      el.addEventListener('click', e => {
        e.preventDefault();
        const on = pinned && current === el;
        hide(true);
        if (!on) { show(el); pinned = true; }
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Escape') hide(true);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });

    document.addEventListener('click', e => {
      if (pinned && !pop.contains(e.target) && !e.target.closest('sup.cite')) hide(true);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(true); });
    window.addEventListener('scroll', () => { if (!pinned) hide(); }, { passive: true });
    window.addEventListener('resize', () => { if (!pinned) hide(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ============ 参考文献页：hash 定位高亮 ============ */
(function () {
  function flash() {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('flash');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => el.classList.remove('flash'), 3200);
  }
  window.addEventListener('load', () => { flash(); setTimeout(flash, 450); setTimeout(flash, 1200); });
  window.addEventListener('hashchange', flash);
})();
