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
    card.className = "bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition flex flex-col justify-between cursor-pointer group";
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

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition" style="background-color: ${ag.color}">${ag.num}</span>
            <span class="font-bold text-slate-900 text-base group-hover:text-sky-600 transition">${ag.id}</span>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${ag.type === 'KRAJ' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
            ${ag.type}
          </span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm sm:text-base mb-2 leading-snug">${ag.name}</h4>
        <p class="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">${ag.desc}</p>
      </div>

      <div class="pt-3.5 border-t border-slate-100 text-xs space-y-2">
        <div class="flex items-center justify-between text-slate-500">
          <span class="font-medium">Personálna kapacita:</span>
          <span class="font-bold text-slate-900 font-mono-code">${ag.fteTotal} FTE</span>
        </div>
        <div class="text-[11px] sm:text-xs text-slate-500">
          <strong class="text-slate-700">Garantujúce okresy:</strong> ${ag.coveredIn.join(', ')}
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-100 text-[11px] sm:text-xs text-sky-600 font-semibold flex items-center justify-between">
          <span class="flex items-center space-x-1.5 group-hover:translate-x-1 transition">
            <i class="fa-solid fa-arrow-down text-[10px]"></i>
            <span>Zobraziť v matici & detail</span>
          </span>
          <i class="fa-solid fa-chevron-right text-[10px] text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition"></i>
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

  DISTRICT_COMPARISON_DATA.forEach(d => {
    if (filter === 'critical' && !d.isCritical) return;

    const tr = document.createElement('tr');
    tr.className = `hover:bg-slate-50 transition ${d.isCritical ? 'bg-rose-50/25' : ''}`;

    const isCriticalBadge = d.isCritical
      ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 ml-1.5" title="Kritické ohrozenie v starom systéme">2 FTE</span>'
      : '';

    tr.innerHTML = `
      <td class="p-3 font-medium border-r border-slate-200">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-900">${d.name} (${d.id})</span>
          ${isCriticalBadge}
        </div>
        <div class="text-[10px] text-slate-400">Región: ${d.region}</div>
      </td>
      <td class="p-3 text-center border-r border-slate-200 font-mono-code font-semibold text-slate-800">${d.villages}</td>
      <td class="p-3 text-center border-r border-slate-200 font-mono-code font-bold text-sky-700">${d.fte} FTE</td>
      <td class="p-3 border-r border-slate-200 bg-rose-50/40 text-slate-700">
        <div class="flex items-center space-x-1.5 text-rose-700 font-semibold mb-1">
          <i class="fa-solid fa-triangle-exclamation text-xs"></i>
          <span>Všetkých 7 agend bez podpory</span>
        </div>
        <p class="text-[11px] leading-relaxed text-slate-600">${d.oldNote}</p>
      </td>
      <td class="p-3 bg-emerald-50/40 text-slate-700">
        <div class="flex items-center space-x-1.5 text-emerald-700 font-semibold mb-1">
          <i class="fa-solid fa-shield-check text-xs"></i>
          <span>Cielená funkčná špecializácia</span>
        </div>
        <p class="text-[11px] leading-relaxed text-slate-600">${d.newNote}</p>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function highlightCompRows(mode) {
  const btnAll = document.getElementById('compFilter-all');
  const btnCrit = document.getElementById('compFilter-critical');
  if (mode === 'all') {
    if (btnAll) btnAll.className = 'px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold';
    if (btnCrit) btnCrit.className = 'px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium';
  } else {
    if (btnCrit) btnCrit.className = 'px-2.5 py-1 rounded-md bg-rose-700 text-white font-semibold';
    if (btnAll) btnAll.className = 'px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium';
  }
  renderComparisonTable(mode);
}
