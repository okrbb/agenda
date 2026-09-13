/* =========================================================================
   COMMAND SEARCH MODULE (Ctrl + K)
   Rýchle vyhľadávanie agend a okresov v reálnom čase s klávesovými skratkami
   ========================================================================= */

let searchSelectedIdx = 0;
let searchCurrentResults = [];

function normalizeStr(str) {
  if (!str) return '';
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getAgendasList() {
  if (typeof AGENDAS !== 'undefined' && Array.isArray(AGENDAS)) return AGENDAS;
  if (window.AGENDAS && Array.isArray(window.AGENDAS)) return window.AGENDAS;
  return [];
}

function getDistrictsList() {
  const list = [];
  if (typeof REGIONS !== 'undefined' && Array.isArray(REGIONS)) {
    REGIONS.forEach(r => {
      if (r.districts) {
        r.districts.forEach(d => {
          list.push({
            id: d.id,
            name: d.name,
            villages: d.villages,
            fte: d.fte,
            region: r.name,
            regionShort: r.shortName,
            ags: d.ags || []
          });
        });
      }
    });
  } else {
    const dict = typeof DISTRICT_DICT !== 'undefined' ? DISTRICT_DICT : (window.DISTRICT_DICT || {});
    Object.keys(dict).forEach(id => {
      list.push({ id, ...dict[id] });
    });
  }
  return list;
}

function openCommandSearch() {
  const modal = document.getElementById('commandSearchModal');
  const input = document.getElementById('commandSearchInput');
  if (!modal || !input) return;

  modal.classList.remove('hidden');
  input.value = '';
  searchSelectedIdx = 0;
  executeCommandSearch('');
  setTimeout(() => input.focus(), 60);
}

function closeCommandSearch() {
  const modal = document.getElementById('commandSearchModal');
  if (modal) modal.classList.add('hidden');
}

function executeCommandSearch(query) {
  const resultsContainer = document.getElementById('commandSearchResults');
  if (!resultsContainer) return;

  const normQ = normalizeStr(query);
  searchCurrentResults = [];
  searchSelectedIdx = 0;

  if (!normQ) {
    resultsContainer.innerHTML = `
      <div class="py-12 px-6 text-center text-slate-400">
        <i class="fa-solid fa-magnifying-glass text-3xl mb-3 text-slate-300"></i>
        <p class="text-xs text-slate-600 font-medium">Začnite písať kód, názov agendy alebo okresu...</p>
        <p class="text-[11px] text-slate-400 mt-1">Napr. <span class="font-semibold text-slate-600">AG3</span>, <span class="font-semibold text-slate-600">povodne</span>, <span class="font-semibold text-slate-600">Brezno</span>, <span class="font-semibold text-slate-600">BB</span> alebo <span class="font-semibold text-slate-600">sever</span></p>
      </div>
    `;
    return;
  }

  const agendas = getAgendasList();
  const districts = getDistrictsList();

  // 1. Vyhľadávanie v agendách
  const matchedAgendas = agendas.filter(ag => {
    return normalizeStr(ag.id).includes(normQ) ||
      normalizeStr(ag.name).includes(normQ) ||
      normalizeStr(ag.shortName).includes(normQ) ||
      normalizeStr(ag.desc).includes(normQ) ||
      (ag.coveredIn && ag.coveredIn.some(d => normalizeStr(d).includes(normQ)));
  });

  // 2. Vyhľadávanie v okresoch
  const matchedDistricts = districts.filter(d => {
    return normalizeStr(d.id).includes(normQ) ||
      normalizeStr(d.name).includes(normQ) ||
      normalizeStr(d.region).includes(normQ) ||
      normalizeStr(d.regionShort).includes(normQ);
  });

  resultsContainer.innerHTML = '';

  if (matchedAgendas.length === 0 && matchedDistricts.length === 0) {
    resultsContainer.innerHTML = `
      <div class="p-8 text-center text-slate-400">
        <i class="fa-solid fa-magnifying-glass text-2xl mb-2 text-slate-300"></i>
        <p class="text-xs">Žiadna agenda ani okres nezodpovedá hľadanému výrazu "${query}".</p>
      </div>
    `;
    return;
  }

  let globalIdx = 0;

  // Render Agendas section
  if (matchedAgendas.length > 0) {
    const agHeading = document.createElement('div');
    agHeading.className = "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-y border-slate-100 flex justify-between";
    agHeading.innerHTML = `<span>Odborné agendy krízového riadenia</span><span>${matchedAgendas.length} výsledkov</span>`;
    resultsContainer.appendChild(agHeading);

    matchedAgendas.forEach(ag => {
      const idx = globalIdx++;
      searchCurrentResults.push({ type: 'agenda', data: ag });

      const item = document.createElement('div');
      item.className = `p-3 flex items-start justify-between gap-3 hover:bg-sky-50/70 cursor-pointer border-b border-slate-100 transition ${idx === searchSelectedIdx ? 'bg-sky-50 ring-1 ring-inset ring-sky-300' : ''}`;
      item.setAttribute('data-idx', idx);
      item.onclick = () => selectSearchResult(idx);

      item.innerHTML = `
        <div class="flex items-start space-x-3">
          <span class="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5" style="background-color: ${ag.color}">
            ${ag.num}
          </span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-900 text-xs sm:text-sm">${ag.id} • ${ag.name}</span>
              <span class="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${ag.type === 'KRAJ' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}">${ag.type}</span>
            </div>
            <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${ag.desc}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-[11px] font-mono font-bold text-slate-700">${ag.fteTotal} FTE</span>
          <div class="text-[10px] text-sky-600 font-semibold mt-0.5 flex items-center justify-end space-x-1">
            <span>Zobraziť</span>
            <i class="fa-solid fa-arrow-right text-[8px]"></i>
          </div>
        </div>
      `;
      resultsContainer.appendChild(item);
    });
  }

  // Render Districts section
  if (matchedDistricts.length > 0) {
    const distHeading = document.createElement('div');
    distHeading.className = "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-y border-slate-100 flex justify-between";
    distHeading.innerHTML = `<span>Okresné pracoviská BBK</span><span>${matchedDistricts.length} okresov</span>`;
    resultsContainer.appendChild(distHeading);

    matchedDistricts.forEach(d => {
      const idx = globalIdx++;
      searchCurrentResults.push({ type: 'district', data: d });

      const item = document.createElement('div');
      item.className = `p-3 flex items-center justify-between hover:bg-sky-50/70 cursor-pointer border-b border-slate-100 transition ${idx === searchSelectedIdx ? 'bg-sky-50 ring-1 ring-inset ring-sky-300' : ''}`;
      item.setAttribute('data-idx', idx);
      item.onclick = () => selectSearchResult(idx);

      item.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="w-7 h-7 rounded-lg bg-slate-800 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
            ${d.id}
          </span>
          <div>
            <div class="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
              <span>${d.name}</span>
              <span class="text-[10px] font-normal text-slate-500">(${d.region})</span>
            </div>
            <p class="text-[11px] text-slate-500">${d.villages} spádových obcí • ${d.fte} zamestnanci</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">Fokus na okres</span>
        </div>
      `;
      resultsContainer.appendChild(item);
    });
  }
}

function selectSearchResult(idx) {
  if (idx < 0 || idx >= searchCurrentResults.length) return;
  const result = searchCurrentResults[idx];
  closeCommandSearch();

  if (result.type === 'agenda') {
    if (typeof highlightAgendaInMatrix === 'function') {
      highlightAgendaInMatrix(result.data.id);
    }
  } else if (result.type === 'district') {
    if (typeof setDistrictFocus === 'function') {
      setDistrictFocus(result.data.id);
    }
  }
}

// Klávesové skratky pre vyhľadávanie
window.addEventListener('keydown', (e) => {
  // Ctrl + K alebo Cmd + K
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openCommandSearch();
    return;
  }

  // ESC pre zatvorenie
  if (e.key === 'Escape') {
    closeCommandSearch();
  }

  const modal = document.getElementById('commandSearchModal');
  if (!modal || modal.classList.contains('hidden')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (searchSelectedIdx < searchCurrentResults.length - 1) {
      searchSelectedIdx++;
      updateSearchSelectionVisual();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (searchSelectedIdx > 0) {
      searchSelectedIdx--;
      updateSearchSelectionVisual();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectSearchResult(searchSelectedIdx);
  }
});

function updateSearchSelectionVisual() {
  const container = document.getElementById('commandSearchResults');
  if (!container) return;
  container.querySelectorAll('[data-idx]').forEach(el => {
    const i = parseInt(el.getAttribute('data-idx'), 10);
    if (i === searchSelectedIdx) {
      el.classList.add('bg-sky-50', 'ring-1', 'ring-inset', 'ring-sky-300');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('bg-sky-50', 'ring-1', 'ring-inset', 'ring-sky-300');
    }
  });
}

// Event listener pre input
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('commandSearchInput');
  if (input) {
    input.addEventListener('input', (e) => executeCommandSearch(e.target.value));
  }
});

window.openCommandSearch = openCommandSearch;
window.closeCommandSearch = closeCommandSearch;
window.executeCommandSearch = executeCommandSearch;
window.selectSearchResult = selectSearchResult;
