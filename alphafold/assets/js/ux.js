/* ============ 功能增强：主题 / 快捷键 / 锚点复制 / 阅读进度 ============ */
(function () {
  const LS_THEME = 'af-theme';
  const LS_PROGRESS = 'af-progress';

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- 主题 ---------- */
  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'auto') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'dark' : 'light';
    } else {
      root.dataset.theme = mode;
    }
    const btn = document.querySelector('.theme-btn');
    if (btn) {
      const dark = root.dataset.theme === 'dark';
      btn.innerHTML = dark
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1z"/></svg>';
      btn.title = dark ? '切换到浅色（t）' : '切换到深色（t）';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(LS_THEME);
    applyTheme(saved === 'light' || saved === 'dark' ? saved : 'auto');
    const bar = document.querySelector('header.top .bar');
    if (!bar) return;
    const btn = document.createElement('button');
    btn.className = 'theme-btn';
    btn.type = 'button';
    bar.insertBefore(btn, document.getElementById('menuBtn') || bar.querySelector('.searchwrap'));
    btn.addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LS_THEME, next);
      applyTheme(next);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!localStorage.getItem(LS_THEME)) applyTheme('auto');
    });
    applyTheme(localStorage.getItem(LS_THEME) || 'auto');
  }

  /* ---------- 锚点复制 ---------- */
  function initAnchors() {
    document.querySelectorAll('main h2, main h3').forEach(h => {
      const sec = h.closest('section.sec');
      const target = sec && sec.id ? sec : null;
      if (!target) return;
      const a = document.createElement('a');
      a.className = 'anchor-link';
      a.href = '#' + target.id;
      a.textContent = '#';
      a.title = '复制本节链接';
      a.addEventListener('click', ev => {
        ev.preventDefault();
        const url = location.origin + location.pathname + '#' + target.id;
        const done = () => { toast('已复制本节链接'); history.replaceState(null, '', '#' + target.id); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(() => { location.hash = target.id; toast('已跳转到本节'); });
        } else {
          location.hash = target.id;
          toast('已跳转到本节');
        }
      });
      h.appendChild(a);
    });
  }

  /* ---------- 阅读进度 ---------- */
  const KEY = () => location.pathname.replace(/\/$/, '/index.html');

  function initProgress() {
    let store = {};
    try { store = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}'); } catch (e) { store = {}; }

    // 章节页：恢复提示 + 记录
    const isHub = /index\.html$/.test(location.pathname) && !/\/alphafold\//.test(location.pathname);
    if (!isHub) {
      const rec = store[KEY()];
      if (rec && rec.pct > 12 && rec.pct < 95) {
        const box = document.createElement('div');
        box.className = 'resume-card';
        box.innerHTML = '<span>上次读到 <b>' + rec.pct + '%</b>　<span class="rs-meta">' + rec.title + '</span></span>' +
          '<a href="#" id="resumeGo">继续阅读 →</a>';
        const main = document.querySelector('main');
        if (main) main.insertBefore(box, main.children[1] || null);
        box.querySelector('#resumeGo').addEventListener('click', ev => {
          ev.preventDefault();
          const y = document.documentElement.scrollHeight * rec.pct / 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        });
      }
      let raf = 0;
      window.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const h = document.documentElement;
          const pct = Math.min(100, Math.round((h.scrollTop + window.innerHeight) / h.scrollHeight * 100));
          if (pct < 5) return;
          store[KEY()] = { pct: pct, title: document.title.split('·')[0].trim(), t: Date.now() };
          try { localStorage.setItem(LS_PROGRESS, JSON.stringify(store)); } catch (e) {}
        });
      }, { passive: true });
    } else {
      // 首页：显示最近阅读
      const items = Object.entries(store)
        .filter(([k]) => k !== KEY())
        .sort((a, b) => b[1].t - a[1].t)
        .slice(0, 1);
      if (items.length) {
        const [path, rec] = items[0];
        const box = document.createElement('div');
        box.className = 'resume-card';
        box.innerHTML = '<span>继续上次阅读：<b>' + rec.title + '</b><span class="rs-meta">（读到 ' + rec.pct + '%）</span></span>' +
          '<a href="' + path + '">打开 →</a>';
        const main = document.querySelector('main');
        if (main) main.insertBefore(box, main.firstChild);
      }
    }
  }

  /* ---------- 快捷键 ---------- */
  function initKeys() {
    const help = document.createElement('div');
    help.id = 'kbdHelp';
    help.innerHTML = '<div class="kbd-card"><h3>键盘快捷键</h3>' +
      '<div class="kbd-row"><span>聚焦站内搜索</span><kbd>/</kbd></div>' +
      '<div class="kbd-row"><span>切换深浅色</span><kbd>t</kbd></div>' +
      '<div class="kbd-row"><span>显示／关闭本帮助</span><kbd>?</kbd></div>' +
      '<div class="kbd-row"><span>显示／关闭本帮助</span><kbd>Esc</kbd></div>' +
      '<div class="kbd-row"><span>上一章 / 下一章</span><kbd>[</kbd><kbd>]</kbd></div>' +
      '<button class="btn primary kbd-close">知道了</button></div>';
    document.body.appendChild(help);
    help.addEventListener('click', e => { if (e.target === help || e.target.classList.contains('kbd-close')) help.classList.remove('show'); });

    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if (typing) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        const q = document.getElementById('q');
        if (q) q.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        help.classList.toggle('show');
      } else if (e.key === 'Escape') {
        help.classList.remove('show');
      } else if (e.key === 't') {
        const cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem(LS_THEME, cur === 'dark' ? 'light' : 'dark');
        applyTheme(cur === 'dark' ? 'light' : 'dark');
        toast(cur === 'dark' ? '浅色模式' : '深色模式');
      } else if (e.key === '[' || e.key === ']') {
        const links = [...document.querySelectorAll('.pager a')];
        const target = e.key === '[' ? links[0] : links[links.length - 1];
        if (target) location.href = target.getAttribute('href');
      }
    });
  }

  function init() {
    initTheme();
    initAnchors();
    initProgress();
    initKeys();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ============ 移动端目录抽屉 + 小节收藏 ============ */
(function () {
  const LS_MARKS = 'af-marks';

  function loadMarks() {
    try { return JSON.parse(localStorage.getItem(LS_MARKS) || '[]'); } catch (e) { return []; }
  }
  function saveMarks(list) {
    try { localStorage.setItem(LS_MARKS, JSON.stringify(list)); } catch (e) {}
  }
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function h2Title(h) {
    const num = h.querySelector('.num');
    const clone = h.cloneNode(true);
    clone.querySelectorAll('.num,.anchor-link,.mark-btn').forEach(x => x.remove());
    const txt = clone.textContent.replace(/\s+/g, ' ').trim();
    return (num ? num.textContent.trim() + ' ' : '') + txt;
  }

  function initToc() {
    const secs = [...document.querySelectorAll('main section.sec[id]')];
    if (secs.length < 2) return;
    const btn = document.createElement('button');
    btn.className = 'toc-fab';
    btn.type = 'button';
    btn.innerHTML = '<span>☰</span>目录';
    btn.setAttribute('aria-label', '打开本页目录');
    document.body.appendChild(btn);

    const sheet = document.createElement('div');
    sheet.className = 'toc-sheet';
    sheet.innerHTML = '<div class="toc-inner"><div class="toc-head"><b>本页目录</b><button class="toc-x" aria-label="关闭">✕</button></div><ul>' +
      secs.map(s => {
        const h = s.querySelector('h2');
        const txt = h ? h2Title(h) : s.id;
        return '<li><a href="#' + s.id + '">' + txt + '</a></li>';
      }).join('') + '</ul></div>';
    document.body.appendChild(sheet);

    btn.addEventListener('click', () => sheet.classList.add('show'));
    sheet.addEventListener('click', e => {
      if (e.target === sheet || e.target.classList.contains('toc-x') || e.target.tagName === 'A') {
        sheet.classList.remove('show');
      }
    });
  }

  function initMarks() {
    const marks = loadMarks();
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('main section.sec[id]').forEach(sec => {
      const h = sec.querySelector('h2');
      if (!h) return;
      const key = page + '#' + sec.id;
      const found = marks.find(m => m.key === key);
      const b = document.createElement('button');
      b.className = 'mark-btn';
      b.type = 'button';
      b.dataset.key = key;
      b.dataset.title = h2Title(h);
      b.textContent = found ? '★' : '☆';
      b.title = found ? '取消收藏' : '收藏本节';
      if (found) b.classList.add('on');
      b.addEventListener('click', ev => {
        ev.preventDefault();
        const list = loadMarks();
        const i = list.findIndex(m => m.key === key);
        if (i >= 0) {
          list.splice(i, 1);
          b.textContent = '☆'; b.classList.remove('on'); b.title = '收藏本节';
          toast('已取消收藏');
        } else {
          list.push({ key: key, title: b.dataset.title, page: page, id: sec.id, t: Date.now() });
          b.textContent = '★'; b.classList.add('on'); b.title = '取消收藏';
          toast('已加入收藏');
        }
        saveMarks(list);
      });
      h.appendChild(b);
    });
  }

  function init() { initToc(); initMarks(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
