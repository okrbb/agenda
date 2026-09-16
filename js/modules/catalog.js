/* =========================================================================
   AGENDAS CATALOG, REGIONS & COMPARISON MODULE
   Katalóg agend, personálny prehľad regiónov a porovnávacia tabuľka
   ========================================================================= */

function highlightAgendaInMatrix(agId) {
  if (typeof switchTab === 'function') {
    switchTab('matrixTab');
  }

  const row = document.querySelector(`#matrixTableBody tr[data-agenda="${agId}"]`);
  const table = document.getElementById('coverageTable');

  if (table) {
    table.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (row) {
    row.classList.remove('agenda-row-pulse');
    void row.offsetWidth; // reflow trigger
    row.classList.add('agenda-row-pulse');
  }

  if (typeof showAgendaModal === 'function') {
    setTimeout(() => {
      showAgendaModal(agId);
    }, 450);
  }
}

function renderAgendasCatalog() {
  const grid = document.getElementById('agendasCatalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  AGENDAS.forEach(ag => {
    const card = document.createElement('div');
    card.className = "revolut-agenda-card group";
    card.style.borderTop = `3px solid ${ag.color}`;
    card.title = `Kliknite pre zobrazenie agendy ${ag.id} v matici funkčnej zodpovednosti`;
    card.onclick = () => highlightAgendaInMatrix(ag.id);
    card.onmouseenter = () => {
      if (typeof highlightAgendaOnMap === 'function') {
        highlightAgendaOnMap(ag.id);
      }
    };
    card.onmouseleave = () => {
      if (typeof clearAgendaOnMap === 'function') {
        clearAgendaOnMap();
      }
    };

    const isKraj = ag.type === 'KRAJ';
    const typeBadge = isKraj
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-900 border border-amber-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Celokrajská</span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${ag.color};"></span>Regionálna</span>`;

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-1 rounded-lg text-white font-mono-code text-xs font-bold tracking-tight shadow-sm" style="background-color: ${ag.color};">
              AG 0${ag.num}
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono-code">${ag.id}</span>
          </div>
          ${typeBadge}
        </div>

        <h4 class="font-bold text-slate-950 text-base group-hover:text-slate-700 transition-colors leading-snug tracking-tight">
          ${ag.name}
        </h4>

        <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">
          ${ag.desc}
        </p>
      </div>

      <div class="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 font-medium">Personálna kapacita:</span>
          <span class="font-bold text-slate-950 font-mono-code text-sm">${ag.fteTotal} FTE</span>
        </div>

        <div class="flex items-start justify-between text-xs gap-2">
          <span class="text-slate-500 font-medium shrink-0">Garantujúce okresy:</span>
          <span class="font-semibold text-slate-700 text-right font-mono-code text-[11px]">${ag.coveredIn.join(' · ')}</span>
        </div>

        <div class="pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-slate-950 transition">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-arrow-down text-[10px] text-slate-400"></i>
            <span>Zobraziť v matici & detail</span>
          </span>
          <span class="w-6 h-6 rounded-full text-white flex items-center justify-center transition shadow-sm" style="background-color: ${ag.color};">
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderRegionsOverview() {
  const container = document.getElementById('regionsGridContainer');
  if (!container) return;
  container.innerHTML = '';

  REGIONS.forEach(reg => {
    const card = document.createElement('div');
    card.className = "p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition";
    card.style.borderTop = `4px solid ${reg.color}`;

    const distHtml = reg.districts.map(d => `
      <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-900 text-sm">${d.name} (${d.id})</span>
            <span class="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded">${d.fte} FTE</span>
          </div>
          <div class="text-xs text-slate-500 mt-0.5">${d.villages} obcí • ${(d.villages / d.fte).toFixed(1)} obcí / FTE</div>
        </div>
        <div class="flex flex-wrap gap-1 max-w-[140px] justify-end">
          ${d.ags.map(agId => {
            const a = getAgenda(agId);
            return `<span class="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center" style="background-color: ${a.color}" title="${a.name}">${a.num}</span>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <div class="text-xs font-bold uppercase tracking-wider" style="color: ${reg.color}">${reg.shortName}</div>
          <h3 class="text-base font-bold text-slate-900">${reg.name}</h3>
        </div>
        <div class="text-right">
          <div class="text-base font-extrabold text-slate-900">${reg.fteTotal} FTE</div>
          <div class="text-xs text-slate-500">${reg.villagesTotal} obcí v obvode</div>
        </div>
      </div>

      <div class="space-y-2.5">
        ${distHtml}
      </div>

      <div class="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
        <span>Priemerná zaťaženosť:</span>
        <span class="font-bold text-slate-800">${(reg.villagesTotal / reg.fteTotal).toFixed(1)} obcí na 1 zamestnanca</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderComparisonTable(filter = 'all') {
  const tbody = document.getElementById('comparisonTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const regionDotColors = {
    'SEVER': '#059669',
    'ZÁPAD': '#4f46e5',
    'JUH': '#d97706',
    'VÝCHOD': '#0284c7'
  };

  DISTRICT_COMPARISON_DATA.forEach((d, idx) => {
    if (filter === 'critical' && !d.isCritical) return;

    const tr = document.createElement('tr');
    const rowBg = d.isCritical
      ? 'bg-rose-50/40 border-l-4 border-l-rose-500'
      : (idx % 2 === 0 ? 'bg-white border-l-4 border-l-transparent' : 'bg-slate-50/60 border-l-4 border-l-transparent');
    
    tr.className = `hover:bg-slate-100/70 transition ${rowBg}`;

    const isCriticalBadge = d.isCritical
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm" title="Kritické ohrozenie v starom systéme"><i class="fa-solid fa-triangle-exclamation text-rose-600"></i></span>'
      : '';

    const regColor = regionDotColors[d.region] || '#64748b';

    tr.innerHTML = `
      <td class="p-3 font-medium border-r border-slate-200">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-950">${d.name} (${d.id})</span>
          ${isCriticalBadge}
        </div>
        <div class="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
          <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${regColor};"></span>
          <span>Región ${d.region}</span>
        </div>
      </td>
      <td class="p-3 text-center border-r border-slate-200 font-mono-code font-semibold text-slate-800">${d.villages}</td>
      <td class="p-3 text-center border-r border-slate-200 font-mono-code font-bold ${d.isCritical ? 'text-rose-700 bg-rose-50/50' : 'text-sky-700'}">${d.fte} FTE</td>
      <td class="p-3 border-r border-slate-200 bg-rose-50/60 text-slate-800">
        <div class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200 mb-1.5">
          <i class="fa-solid fa-circle-xmark text-rose-500"></i>
          <span>Starý stav: 7 agend bez zastúpenia</span>
        </div>
        <p class="text-[11px] leading-relaxed text-slate-700">${d.oldNote}</p>
      </td>
      <td class="p-3 bg-emerald-50/60 text-slate-800">
        <div class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 mb-1.5">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          <span>Nový stav: Špecializácia & Región</span>
        </div>
        <p class="text-[11px] leading-relaxed text-slate-700">${d.newNote}</p>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function highlightCompRows(mode) {
  const btnAll = document.getElementById('compFilter-all');
  const btnCrit = document.getElementById('compFilter-critical');
  if (mode === 'all') {
    if (btnAll) btnAll.className = 'px-3 py-1 rounded-lg bg-slate-950 text-white font-bold text-xs shadow-sm';
    if (btnCrit) btnCrit.className = 'px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200';
  } else {
    if (btnCrit) btnCrit.className = 'px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-sm ring-2 ring-rose-400/40';
    if (btnAll) btnAll.className = 'px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200';
  }
  renderComparisonTable(mode);
}
