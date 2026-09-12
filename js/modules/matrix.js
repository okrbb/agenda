/* =========================================================================
   COVERAGE MATRIX MODULE (HEATMAP & FILTERS)
   Matica funkčnej zodpovednosti, regionálne filtre a CSV export
   ========================================================================= */

let matrixFilter = 'all';
let matrixCellMode = 'standard';

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
    tr.className = "hover:bg-slate-50/80 transition group";

    // Col 1: Agenda code and title
    const tdAgenda = document.createElement('td');
    tdAgenda.className = "p-2.5 font-medium sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 cursor-pointer";
    tdAgenda.onclick = () => showAgendaModal(ag.id);
    tdAgenda.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style="background-color: ${ag.color}">${ag.num}</span>
        <div>
          <div class="font-bold text-slate-900 flex items-center space-x-1">
            <span>${ag.id}</span>
            <i class="fa-solid fa-circle-question text-[10px] text-slate-400 group-hover:text-sky-500"></i>
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

    // Cols for each of the 13 districts: Clean colored tiles
    districtsList.forEach(d => {
      const td = document.createElement('td');
      td.className = "p-1.5 text-center border-r border-slate-200";
      td.setAttribute('data-dist', d.id);
      td.setAttribute('data-region', d.region);

      const hasAgenda = ag.coveredIn.includes(d.id);

      if (hasAgenda) {
        const isKraj = ag.type === 'KRAJ';
        const sizeClasses = matrixCellMode === 'compact' ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg';
        
        td.innerHTML = `
          <div onclick="showCellDetail('${ag.id}', '${d.id}')" class="mx-auto ${sizeClasses} cursor-pointer shadow-sm transform hover:scale-115 hover:shadow-md transition duration-150 relative" style="background-color: ${ag.color};" title="${ag.id} (${ag.shortName}) - OÚ ${d.id}">
            ${isKraj ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white shadow-sm" title="Celokrajská pôsobnosť"></span>' : ''}
          </div>
        `;
      } else {
        td.innerHTML = `<div class="w-2 h-2 rounded-full bg-slate-200 mx-auto opacity-60"></div>`;
      }

      tr.appendChild(td);
    });

    // Col total FTE for this agenda
    const tdTotal = document.createElement('td');
    tdTotal.className = "p-2.5 text-center font-bold text-slate-800 bg-slate-50";
    tdTotal.innerHTML = `<span class="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono-code">${ag.fteTotal} FTE</span>`;
    tr.appendChild(tdTotal);

    tbody.appendChild(tr);
  });
}

function filterMatrix(regionKey) {
  matrixFilter = regionKey;

  ['all', 'sever', 'zapad', 'juh', 'vychod'].forEach(k => {
    const btn = document.getElementById('filter-' + k);
    if (btn) {
      if (k === regionKey) {
        btn.className = "px-2.5 py-1 rounded-md bg-slate-900 text-white shadow-sm font-semibold transition";
      } else {
        btn.className = "px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition";
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

function setMatrixCellMode(mode) {
  matrixCellMode = mode;
  const btnStd = document.getElementById('matrixModeStandard');
  const btnCmp = document.getElementById('matrixModeCompact');
  if (btnStd && btnCmp) {
    btnStd.className = mode === 'standard'
      ? "px-2.5 py-1 rounded border border-sky-300 bg-sky-50 text-sky-800 font-semibold transition"
      : "px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition";
    
    btnCmp.className = mode === 'compact'
      ? "px-2.5 py-1 rounded border border-sky-300 bg-sky-50 text-sky-800 font-semibold transition"
      : "px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition";
  }

  renderMatrix();
}

function exportMatrixCSV() {
  let csv = "ID;Agenda;Pôsobnosť;BB;BR;RA;ZV;ZC;ZH;BS;KA;VK;LC;DT;PT;RS;Spolu FTE\n";
  const distKeys = ["BB", "BR", "RA", "ZV", "ZC", "ZH", "BS", "KA", "VK", "LC", "DT", "PT", "RS"];
  
  AGENDAS.forEach(ag => {
    const row = [
      ag.id,
      `"${ag.name}"`,
      ag.type,
      ...distKeys.map(d => ag.coveredIn.includes(d) ? "1" : "0"),
      ag.fteTotal
    ];
    csv += row.join(";") + "\n";
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "matica_funkcnej_zodpovednosti_OKR_BBK.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast("Matica bola exportovaná do CSV.", "success");
}
