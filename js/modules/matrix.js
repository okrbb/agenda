/* =========================================================================
   COVERAGE MATRIX MODULE (HEATMAP, CROSSHAIR & FILTERS) - 2026 EDITION
   Matica funkčnej zodpovednosti, crosshair tracking, regionálne filtre a CSV export
   ========================================================================= */

let matrixFilter = 'all';

function clearMatrixCrosshair() {
  document.querySelectorAll('#coverageTable tr.crosshair-row-highlight').forEach(el => {
    el.classList.remove('crosshair-row-highlight');
  });
  document.querySelectorAll('#coverageTable .crosshair-col-highlight').forEach(el => {
    el.classList.remove('crosshair-col-highlight');
  });
}

function applyMatrixCrosshair(distId, trElement) {
  clearMatrixCrosshair();
  if (trElement) {
    trElement.classList.add('crosshair-row-highlight');
  }
  if (distId) {
    const colCells = document.querySelectorAll(`#coverageTable [data-dist="${distId}"]`);
    colCells.forEach(cell => cell.classList.add('crosshair-col-highlight'));
  }
}

function renderMatrix() {
  const tbody = document.getElementById('matrixTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const districtsList = [
    { id: "BB", region: "sever" }, { id: "BR", region: "sever" }, { id: "RA", region: "sever" },
    { id: "ZV", region: "zapad" }, { id: "ZC", region: "zapad" }, { id: "ZH", region: "zapad" }, { id: "BS", region: "zapad" },
    { id: "KA", region: "juh" }, { id: "VK", region: "juh" }, { id: "LC", region: "juh" },
    { id: "DT", region: "vychod" }, { id: "PT", region: "vychod" }, { id: "RS", region: "vychod" }
  ];

  AGENDAS.forEach(ag => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-sky-50/60 transition group";
    tr.setAttribute('data-agenda', ag.id);

    // Col 1: Agenda code and title
    const tdAgenda = document.createElement('td');
    tdAgenda.className = "p-2.5 font-medium matrix-sticky-col bg-white group-hover:bg-sky-50/90 border-r border-slate-200 cursor-pointer transition";
    tdAgenda.onclick = () => showAgendaModal(ag.id);
    tdAgenda.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <span class="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style="background-color: ${ag.color}">${ag.num}</span>
        <div>
          <div class="font-bold text-slate-900 flex items-center space-x-1">
            <span>${ag.id}</span>
            <i class="fa-solid fa-circle-question text-[10px] text-slate-400 group-hover:text-sky-500 transition"></i>
          </div>
          <div class="text-[11px] text-slate-500 truncate max-w-[150px]" title="${ag.name}">${ag.shortName}</div>
        </div>
      </div>
    `;
    tr.appendChild(tdAgenda);

    // Col 2: Scope badge
    const tdType = document.createElement('td');
    tdType.className = "p-2.5 text-center border-r border-slate-200";
    if (ag.type === 'KRAJ') {
      tdType.innerHTML = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">KRAJ</span>`;
    } else {
      tdType.innerHTML = `<span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700">Región</span>`;
    }
    tr.appendChild(tdType);

    // Cols for each of the 13 districts: Interactive Heatmap Pods
    districtsList.forEach(d => {
      const td = document.createElement('td');
      td.className = "p-1.5 text-center border-r border-slate-200 transition-colors duration-150";
      td.setAttribute('data-dist', d.id);
      td.setAttribute('data-region', d.region);

      const hasAgenda = ag.coveredIn.includes(d.id);

      if (hasAgenda) {
        const isKraj = ag.type === 'KRAJ';
        const sizeClasses = 'w-7 h-7';
        
        td.innerHTML = `
          <div onclick="showCellDetail('${ag.id}', '${d.id}')" 
               class="matrix-cell-node mx-auto ${sizeClasses} cursor-pointer flex items-center justify-center relative" 
               style="background: linear-gradient(135deg, ${ag.color} 0%, ${ag.color}dd 100%);" 
               title="${ag.id} (${ag.shortName}) - OÚ ${d.id}">
            ${isKraj ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white shadow-sm" title="Celokrajská pôsobnosť"></span>' : ''}
          </div>
        `;
      } else {
        td.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-slate-300/70 mx-auto"></div>`;
      }

      // Crosshair tracking events
      td.addEventListener('mouseenter', () => {
        applyMatrixCrosshair(d.id, tr);
      });

      tr.appendChild(td);
    });

    // Col total FTE for this agenda
    const tdTotal = document.createElement('td');
    tdTotal.className = "p-2.5 text-center font-bold text-slate-800 bg-slate-50";
    tdTotal.innerHTML = `<span class="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono-code">${ag.fteTotal} FTE</span>`;
    tr.appendChild(tdTotal);

    tbody.appendChild(tr);
  });

  // Clear crosshair on leaving the matrix table
  const table = document.getElementById('coverageTable');
  if (table && !table._hasCrosshairLeave) {
    table.addEventListener('mouseleave', clearMatrixCrosshair);
    table._hasCrosshairLeave = true;
  }
}

function filterMatrix(regionKey) {
  matrixFilter = regionKey;

  const filterDefs = [
    { key: 'all', fte: '37 FTE' },
    { key: 'sever', fte: '12 FTE' },
    { key: 'zapad', fte: '9 FTE' },
    { key: 'juh', fte: '8 FTE' },
    { key: 'vychod', fte: '8 FTE' }
  ];

  filterDefs.forEach(def => {
    const btn = document.getElementById('filter-' + def.key);
    if (btn) {
      if (def.key === regionKey) {
        btn.className = "px-3 py-1.5 rounded-lg bg-sky-600 text-white shadow-sm font-semibold transition flex items-center space-x-1.5";
      } else {
        btn.className = "px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center space-x-1.5";
      }
    }
  });

  const thRegions = document.querySelectorAll('#coverageTable th[data-region]');
  const thDists = document.querySelectorAll('#coverageTable th[data-dist]');
  const tdDists = document.querySelectorAll('#coverageTable td[data-dist]');
  const tfDists = document.querySelectorAll('#coverageTable tfoot td[data-dist]');

  if (regionKey === 'all') {
    thRegions.forEach(el => el.classList.remove('hidden'));
    thDists.forEach(el => el.classList.remove('hidden'));
    tdDists.forEach(el => el.classList.remove('hidden'));
    tfDists.forEach(el => el.classList.remove('hidden'));
  } else {
    thRegions.forEach(el => {
      if (el.getAttribute('data-region') === regionKey) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    [...thDists, ...tdDists, ...tfDists].forEach(el => {
      if (el.getAttribute('data-region') === regionKey) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
  }

  showToast(`Filter matice: ${regionKey.toUpperCase()}`, "info");
}
