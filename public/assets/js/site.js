/* =========================================================================
   Site behaviour: equipment lists, skid tables, navigation
   ========================================================================= */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------- nav */

  const nav = $('#nav');
  const navToggle = $('#navToggle');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const sections = $$('main section[id]');
  const navLinks = $$('#nav a');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => seen.set(en.target.id, en.intersectionRatio));
        let best = null;
        let bestRatio = 0;
        seen.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        });
        if (!best) return;
        navLinks.forEach((a) => a.classList.remove('active'));
        const link = byId.get(best);
        if (link) link.classList.add('active');
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: [0.02, 0.15, 0.35, 0.6] }
    );
    sections.forEach((s) => io.observe(s));
  }

  const printBtn = $('#printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  /* ---------------------------------------------------- equipment areas */

  const areasEl = $('#equipment-areas');
  const searchEl = $('#equipSearch');
  const countEl = $('#equipCount');
  const itemTotal = EQUIPMENT_AREAS.reduce((n, a) => n + a.items.length, 0);

  const scopeLabel = {
    company: 'Company scope · EPF Contractor operates & maintains',
    epf: 'EPF Contractor scope'
  };

  function esc(s) {
    return String(s);
  }

  function renderAreas() {
    areasEl.innerHTML = EQUIPMENT_AREAS.map((area, i) => {
      const rows = area.items.map((it) => `
        <tr data-eq>
          <td class="mono">${esc(it.tag)}</td>
          <td><strong>${esc(it.name)}</strong></td>
          <td>${esc(it.spec)}</td>
          <td class="muted">${esc(it.note)}</td>
        </tr>`).join('');

      return `
      <details class="area" ${i === 0 ? 'open' : ''} data-area="${area.id}">
        <summary>
          <span class="a-id">${area.id}</span>
          <span class="a-title">
            <strong>${esc(area.title)}</strong>
            <span>${esc(area.sub)}</span>
          </span>
          <span class="a-meta">
            <span class="a-count">${area.items.length} items</span>
            <span class="a-caret" aria-hidden="true"></span>
          </span>
        </summary>
        <div class="area-body">
          <p>${area.intro}</p>
          <span class="scope-tag ${area.scope}">${scopeLabel[area.scope] || ''}</span>
          <div class="tbl-wrap">
            <table class="tbl tbl-compact">
              <thead><tr><th style="width:19%">Tag</th><th style="width:26%">Item</th><th style="width:18%">Size / duty</th><th>Notes</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </details>`;
    }).join('');

    if (countEl) countEl.textContent = `${itemTotal} items · ${EQUIPMENT_AREAS.length} areas`;
  }

  if (areasEl && typeof EQUIPMENT_AREAS !== 'undefined') {
    renderAreas();

    const setCount = (n) => {
      if (countEl) countEl.textContent = n === itemTotal
        ? `${itemTotal} items · ${EQUIPMENT_AREAS.length} areas`
        : `${n} of ${itemTotal} items`;
    };

    if (searchEl) {
      searchEl.addEventListener('input', () => {
        const q = searchEl.value.trim().toLowerCase();
        let shown = 0;

        $$('.area', areasEl).forEach((details) => {
          const rows = $$('tbody tr', details);
          let areaHits = 0;
          rows.forEach((tr) => {
            const hit = !q || tr.textContent.toLowerCase().includes(q);
            tr.hidden = !hit;
            if (hit) areaHits++;
          });
          details.hidden = areaHits === 0;
          shown += areaHits;
          if (q) details.open = areaHits > 0;
        });

        setCount(shown);
      });
    }

    const expandAll = $('#expandAll');
    const collapseAll = $('#collapseAll');
    if (expandAll) expandAll.addEventListener('click', () => $$('.area', areasEl).forEach((d) => { d.open = true; }));
    if (collapseAll) collapseAll.addEventListener('click', () => $$('.area', areasEl).forEach((d) => { d.open = false; }));
  }

  /* ------------------------------------------------------------- skids */

  if (typeof SKID_GROUPS !== 'undefined' && $('#skidTable')) {
    const body = $('#skidTable tbody');
    const foot = $('#skidTable tfoot');

    const groupTotal = (g) => g.rows.reduce((n, r) => n + r.m + r.n + r.y + r.s, 0);
    const kindTotals = { process: 0, electrical: 0, site: 0 };

    const rowsHtml = SKID_GROUPS.map((g) => {
      const gt = groupTotal(g);
      kindTotals[g.kind] += gt;
      const head = `<tr class="grp"><td colspan="2">${g.area} — ${g.title}</td>
        <td class="num" colspan="5">${gt}</td></tr>`;
      const rows = g.rows.map((r) => {
        const t = r.m + r.n + r.y + r.s;
        return `<tr>
          <td class="mono">${g.area}</td>
          <td>${r.name}</td>
          <td class="num">${r.m || '—'}</td>
          <td class="num">${r.n || '—'}</td>
          <td class="num">${r.y || '—'}</td>
          <td class="num">${r.s || '—'}</td>
          <td class="num"><strong>${t}</strong></td>
        </tr>`;
      }).join('');
      return head + rows;
    }).join('');

    body.innerHTML = rowsHtml;

    const mTotal = SKID_GROUPS.reduce((n, g) => n + g.rows.reduce((a, r) => a + r.m, 0), 0);
    const nTotal = SKID_GROUPS.reduce((n, g) => n + g.rows.reduce((a, r) => a + r.n, 0), 0);
    const yTotal = SKID_GROUPS.reduce((n, g) => n + g.rows.reduce((a, r) => a + r.y, 0), 0);
    const sTotal = SKID_GROUPS.reduce((n, g) => n + g.rows.reduce((a, r) => a + r.s, 0), 0);
    const grand = mTotal + nTotal + yTotal + sTotal;

    foot.innerHTML = `<tr>
      <td colspan="2">Total packaged units</td>
      <td class="num">${mTotal}</td>
      <td class="num">${nTotal}</td>
      <td class="num">${yTotal}</td>
      <td class="num">${sTotal}</td>
      <td class="num">${grand}</td>
    </tr>
    <tr>
      <td colspan="7" class="muted" style="font-weight:450;background:#f8fafc">
        Process skids ${kindTotals.process} · electrical &amp; ICSS packages ${kindTotals.electrical} ·
        site containers ${kindTotals.site} — indicative, ±10%.
      </td>
    </tr>`;

    const kpiEl = $('#skidKpis');
    if (kpiEl) {
      const kpis = [
        { n: kindTotals.process, l: 'Process skids', e: 'Mechanical, piping, instruments' },
        { n: kindTotals.electrical, l: 'Electrical & ICSS', e: 'Containers and packages' },
        { n: kindTotals.site, l: 'Site containers', e: 'Control room, workshop, camp' },
        { n: grand, l: 'Total packaged units', e: '≈38–46 road modules' }
      ];
      kpiEl.innerHTML = kpis.map((k) => `
        <div class="kpi"><b>${k.n}</b><span>${k.l}</span><em>${k.e}</em></div>`).join('');
    }

    const barsEl = $('#skidBars');
    if (barsEl) {
      const max = Math.max(...SKID_GROUPS.map(groupTotal));
      barsEl.innerHTML = SKID_GROUPS.map((g) => {
        const t = groupTotal(g);
        const pct = Math.max(6, Math.round((t / max) * 100));
        return `<div class="bar">
          <div>
            <div class="bar-l"><span style="color:var(--text-2)">${g.area} · ${g.title}</span><span>${t}</span></div>
            <div class="bar-track"><div class="bar-fill" data-w="${pct}"></div></div>
          </div>
          <div class="bar-v"></div>
        </div>`;
      }).join('');

      requestAnimationFrame(() => {
        $$('.bar-fill', barsEl).forEach((el) => { el.style.width = el.dataset.w + '%'; });
      });
    }
  }
})();
