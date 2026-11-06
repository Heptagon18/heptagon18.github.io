/* ============ AlphaFold 数据库在线检索（UniProt + AFDB API，带超时与降级） ============ */
(function () {
  const ACC = /^[A-NR-Z0-9][0-9][A-Z0-9]{3}[0-9](-\d+)?$/i;
  const cache = new Map();
  const TIMEOUT = 12000;

  async function getJSON(url, ms) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms || TIMEOUT);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /* 少量已验证的离线缓存：网络不可用时仍能给出可用结果 */
  const LOCAL = [
    { acc: 'P69905', name: 'Hemoglobin subunit alpha', gene: 'HBA1', org: 'Homo sapiens', plddt: 98.06 },
    { acc: 'P68871', name: 'Hemoglobin subunit beta', gene: 'HBB', org: 'Homo sapiens', plddt: 97.20 },
    { acc: 'P02042', name: 'Hemoglobin subunit delta', gene: 'HBD', org: 'Homo sapiens', plddt: 96.90 },
    { acc: 'P61626', name: 'Lysozyme C', gene: 'LYZ', org: 'Homo sapiens', plddt: 94.10 },
    { acc: 'P00709', name: 'Alpha-lactalbumin', gene: 'LALBA', org: 'Homo sapiens', plddt: 91.70 },
    { acc: 'O75551', name: 'Lysozyme-like protein 6', gene: 'LYZL6', org: 'Homo sapiens', plddt: 92.70 }
  ];

  function init() {
    const box = document.getElementById('afdbSearch');
    if (!box) return;
    const input = document.getElementById('afdbQ');
    const btn = document.getElementById('afdbGo');
    const out = document.getElementById('afdbOut');
    const chips = box.querySelectorAll('.afdb-chip');

    const SUGGEST = {
      '血红蛋白': 'hemoglobin subunit beta human',
      '胰岛素': 'insulin human',
      '溶菌酶': 'lysozyme human',
      'p53': 'cellular tumor antigen p53 human',
      '绿色荧光蛋白': 'green fluorescent protein'
    };

    const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const color = p => p >= 90 ? '#0a7d5a' : p >= 70 ? '#1f6fb2' : p >= 50 ? '#c9801d' : '#b3403f';

    function bar(p) {
      const v = Math.max(0, Math.min(100, p || 0));
      return '<div class="afdb-bar"><i style="width:' + v + '%;background:' + color(v) + '"></i></div>';
    }

    function legendRow(text, n) {
      return '<div class="afdb-sum">为「' + esc(text) + '」找到 <b>' + n + '</b> 个匹配条目' +
        '<span class="afdb-legend">pLDDT：' +
        '<i style="background:#0a7d5a"></i>≥90 很高 ' +
        '<i style="background:#1f6fb2"></i>70–90 可信 ' +
        '<i style="background:#c9801d"></i>50–70 较低 ' +
        '<i style="background:#b3403f"></i>&lt;50 很低</span>' +
        '<a class="afdb-site" href="https://alphafold.ebi.ac.uk/search?q=' + encodeURIComponent(text) +
        '" target="_blank" rel="noopener">在 AFDB 网站检索 ↗</a></div>';
    }

    function loading() {
      out.innerHTML = '<div class="afdb-loading"><span></span><span></span><span></span>正在查询 UniProt 与 AlphaFold DB…</div>';
    }

    function error(msg, q) {
      out.innerHTML = '<div class="afdb-err">' + esc(msg) + '</div>' +
        '<div class="afdb-err-actions">' +
        '<button class="btn" id="afdbRetry">重试</button>' +
        '<a class="afdb-fallback" href="https://alphafold.ebi.ac.uk/search?q=' + encodeURIComponent(q) +
        '" target="_blank" rel="noopener">在 AFDB 网站检索 ↗</a>' +
        '<a class="afdb-fallback" href="https://www.uniprot.org/uniprotkb?query=' + encodeURIComponent(q) +
        '" target="_blank" rel="noopener">在 UniProt 检索 ↗</a></div>';
      const rt = document.getElementById('afdbRetry');
      if (rt) rt.addEventListener('click', () => run(q));
    }

    async function uniprotSearch(q) {
      const query = ACC.test(q) ? 'accession:' + q : '(' + q + ')';
      const url = 'https://rest.uniprot.org/uniprotkb/search?query=' + encodeURIComponent(query) +
        '&format=json&size=4&fields=accession,protein_name,gene_names,organism_name,length';
      const j = await getJSON(url);
      return (j.results || []).map(it => ({
        acc: it.primaryAccession,
        name: (it.proteinDescription && it.proteinDescription.recommendedName &&
          it.proteinDescription.recommendedName.fullName &&
          it.proteinDescription.recommendedName.fullName.value) || it.primaryAccession,
        genes: (it.genes || []).map(g => g.geneName && g.geneName.value).filter(Boolean).join(', '),
        org: (it.organism && it.organism.scientificName) || '',
        len: (it.sequence && it.sequence.length) || 0
      }));
    }

    async function afdb(acc) {
      if (cache.has(acc)) return cache.get(acc);
      const j = await getJSON('https://alphafold.ebi.ac.uk/api/prediction/' + encodeURIComponent(acc));
      const d = Array.isArray(j) ? j[0] : j;
      if (!d) return null;
      const info = {
        entry: d.entryId || ('AF-' + acc + '-F1'),
        plddt: typeof d.globalMetricValue === 'number' ? d.globalMetricValue : null,
        pdb: d.pdbUrl, cif: d.cifUrl, pae: d.paeImageUrl,
        desc: d.uniprotDescription || '',
        start: d.sequenceStart, end: d.sequenceEnd
      };
      cache.set(acc, info);
      return info;
    }

    function card(hit, info) {
      const p = info && info.plddt != null ? info.plddt : null;
      const lenTxt = info && info.start ? (info.start + '–' + info.end) : (hit.len ? hit.len + ' aa' : '');
      return '<div class="afdb-card">' +
        '<div class="afdb-card-head"><b>' + esc(hit.name) + '</b><span class="afdb-acc">' + esc(hit.acc) + '</span></div>' +
        '<div class="afdb-meta">' + (hit.genes ? '基因 ' + esc(hit.genes) + '　' : '') +
        (hit.org ? esc(hit.org) : '') + (lenTxt ? '　' + lenTxt : '') + '</div>' +
        (p != null
          ? '<div class="afdb-score"><span>平均 pLDDT <b style="color:' + color(p) + '">' + p.toFixed(1) + '</b></span>' + bar(p) + '</div>'
          : '<div class="afdb-meta" style="color:#8a3b3b">该编号在 AlphaFold DB 中没有对应条目</div>') +
        '<div class="afdb-links">' +
        '<a href="https://alphafold.ebi.ac.uk/entry/' + encodeURIComponent(hit.acc) + '" target="_blank" rel="noopener">3D 结构 ↗</a>' +
        (info && info.pdb ? '<a href="' + info.pdb + '" target="_blank" rel="noopener">下载 PDB</a>' : '') +
        (info && info.pae ? '<a href="' + info.pae + '" target="_blank" rel="noopener">PAE 图</a>' : '') +
        '<a href="https://www.uniprot.org/uniprotkb/' + encodeURIComponent(hit.acc) + '" target="_blank" rel="noopener">UniProt ↗</a>' +
        '</div></div>';
    }

    async function run(q) {
      const text = (q || '').trim();
      if (!text) { out.innerHTML = '<div class="afdb-hint">输入蛋白名、基因名或 UniProt 编号后再检索。</div>'; return; }
      loading();
      btn.disabled = true;
      try {
        if (ACC.test(text)) {
          const info = await afdb(text).catch(() => null);
          if (info) {
            const hit = { acc: text.toUpperCase(), name: info.desc || text.toUpperCase(), genes: '', org: '', len: 0 };
            out.innerHTML = legendRow(text, 1) + card(hit, info);
            return;
          }
        }
        const hits = await uniprotSearch(text);
        if (!hits.length) { error('没有在 UniProt 中找到匹配的蛋白。', text); return; }
        const infos = await Promise.all(hits.map(h => afdb(h.acc).catch(() => null)));
        out.innerHTML = legendRow(text, hits.length) + hits.map((h, i) => card(h, infos[i])).join('');
      } catch (e) {
        const key = text.toLowerCase();
        const offline = LOCAL.filter(r =>
          r.acc.toLowerCase() === key ||
          r.name.toLowerCase().includes(key) ||
          (r.gene && r.gene.toLowerCase() === key));
        if (offline.length) {
          out.innerHTML = '<div class=afdb-sum><b>网络不可用</b>，以下为站内缓存条目（数值来自此前实时查询）' +
            '<a class=afdb-site href="https://alphafold.ebi.ac.uk/search?q=' + encodeURIComponent(text) +
            '" target="_blank" rel="noopener">在 AFDB 网站检索 ↗</a></div>' +
            offline.map(r => card({ acc: r.acc, name: r.name, genes: r.gene, org: r.org, len: 0 },
              { plddt: r.plddt, pdb: null, pae: null })).join('');
          return;
        }
        const msg = e.name === 'AbortError' ? '请求超时（可能是网络较慢或被拦截）' : ('检索失败：' + (e.message || '网络异常'));
        error(msg, text);
      } finally {
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', () => run(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(input.value); });
    chips.forEach(c => c.addEventListener('click', () => {
      const label = c.dataset.label || c.textContent.trim();
      input.value = SUGGEST[label] || label;
      run(input.value);
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
