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
          <div class="text-[11px] text-slate-500 truncate max-w-[150px]">${ag.shortName}</div>
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
              style="background: linear-gradient(135deg, ${ag.color} 0%, ${ag.color}dd 100%);">
            ${isKraj ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white shadow-sm"></span>' : ''}
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

  // Initialize the rich tooltip for district headers.
  initDistrictHeaderTooltips();
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

/* =========================================================================
   2F. BOHATÝ TOOLTIP PRE HLAVIČKY OKRESOV
   ========================================================================= */
function getClosestDistricts(distId, count = 2) {
  const dict = typeof DISTRICT_DICT !== 'undefined' ? DISTRICT_DICT : (window.DISTRICT_DICT || {});
  const results = [];
  Object.keys(dict).forEach(otherId => {
    if (otherId === distId) return;
    if (typeof getPairData === 'function') {
      const pair = getPairData(distId, otherId);
      if (pair) {
        results.push({
          id: otherId,
          name: dict[otherId].name,
          minutes: pair.minutes,
          km: pair.km,
          time: pair.timeFormatted || pair.time
        });
      }
    }
  });
  results.sort((a, b) => a.minutes - b.minutes);
  return results.slice(0, count);
}

function showDistrictHeaderTooltip(e, distId) {
  const tooltip = document.getElementById('districtHeaderTooltip');
  if (!tooltip) return;

  const dict = typeof DISTRICT_DICT !== 'undefined' ? DISTRICT_DICT : (window.DISTRICT_DICT || {});
  const d = dict[distId];
  if (!d) return;

  let villages = d.villages || 0;
  if (!villages && typeof DISTRICT_COMPARISON_DATA !== 'undefined') {
    const comp = DISTRICT_COMPARISON_DATA.find(c => c.id === distId);
    if (comp) villages = comp.villages;
  }

  let agList = [];
  if (typeof AGENDAS !== 'undefined') {
    agList = AGENDAS.filter(a => a.coveredIn.includes(distId)).map(a => a.id);
  }

  let closestHtml = '';
  const closest = getClosestDistricts(distId, 2);
  if (closest.length > 0) {
    closestHtml = closest.map(c => `• <span class="font-bold text-white">${c.name} (${c.id})</span>: <span class="text-emerald-400 font-semibold">${c.time}</span> <span class="text-slate-400">(${c.km} km)</span>`).join('<br>');
  }

  tooltip.innerHTML = `
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-2">
      <div class="flex items-center space-x-2">
        <span class="w-6 h-6 rounded bg-sky-600 text-white font-mono font-bold flex items-center justify-center text-xs shadow-sm">${distId}</span>
        <span class="font-bold text-white text-xs">${d.name}</span>
      </div>
      <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-sky-400 border border-slate-700">${d.region}</span>
    </div>
    
    <div class="grid grid-cols-2 gap-2 text-center mb-2">
      <div class="p-1.5 rounded bg-slate-800/90 border border-slate-700/60">
        <div class="text-[9px] text-slate-400 uppercase font-semibold">Úväzky</div>
        <div class="font-mono font-bold text-sky-400 text-xs">${d.fte} FTE</div>
      </div>
      <div class="p-1.5 rounded bg-slate-800/90 border border-slate-700/60">
        <div class="text-[9px] text-slate-400 uppercase font-semibold">Spravované obce</div>
        <div class="font-mono font-bold text-slate-200 text-xs">${villages}</div>
      </div>
    </div>

    ${closestHtml ? `
      <div class="text-[10px] space-y-1 mb-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
        <div class="text-slate-400 font-semibold flex items-center space-x-1.5">
          <i class="fa-solid fa-truck-fast text-emerald-400 text-[10px]"></i>
          <span class="uppercase tracking-wider text-[9px]">Najbližšie posilové okresy:</span>
        </div>
        <div class="text-slate-200 leading-snug pt-0.5">${closestHtml}</div>
      </div>
    ` : ''}

    ${agList.length > 0 ? `
      <div class="mb-2 text-[10px] text-slate-300">
        <span class="text-slate-400 text-[9px] uppercase font-semibold mr-1">Garantované:</span>
        <span class="font-bold text-sky-300 font-mono">${agList.join(', ')}</span>
      </div>
    ` : ''}

    <div class="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-700/80 flex items-center justify-center space-x-1">
      <i class="fa-solid fa-hand-pointer text-sky-400 text-[8px]"></i>
      <span>Kliknutím aktivujete / deaktivujete fokus a zástupcov</span>
    </div>
  `;

  moveDistrictHeaderTooltip(e);
  tooltip.classList.add('visible');
}

function moveDistrictHeaderTooltip(e) {
  const tooltip = document.getElementById('districtHeaderTooltip');
  if (!tooltip || !tooltip.classList.contains('visible')) return;

  const pad = 14;
  let left = e.clientX + pad;
  let top = e.clientY + pad;

  const tipRect = tooltip.getBoundingClientRect();
  if (left + tipRect.width > window.innerWidth - 10) {
    left = e.clientX - tipRect.width - pad;
  }
  if (top + tipRect.height > window.innerHeight - 10) {
    top = e.clientY - tipRect.height - pad;
  }

  tooltip.style.left = `${Math.max(10, left)}px`;
  tooltip.style.top = `${Math.max(10, top)}px`;
}

function hideDistrictHeaderTooltip() {
  const tooltip = document.getElementById('districtHeaderTooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

function initDistrictHeaderTooltips() {
  const headers = document.querySelectorAll('#coverageTable th[data-dist]');
  headers.forEach(th => {
    const distId = th.getAttribute('data-dist');
    th.onmouseenter = (e) => showDistrictHeaderTooltip(e, distId);
    th.onmouseleave = hideDistrictHeaderTooltip;
    th.onmousemove = moveDistrictHeaderTooltip;
  });
}

/* =========================================================================
   FOKUS NA OKRES (DISTRICT FOCUS MODE) & 1A. SIMULÁCIA VÝPADKU
   ========================================================================= */
let activeDistrictFocus = null;
let activeDistrictOutage = null;

function setDistrictFocus(distId) {
  const dict = typeof DISTRICT_DICT !== 'undefined' ? DISTRICT_DICT : (window.DISTRICT_DICT || {});
  if (!distId || !dict[distId]) return;

  // Ak už je tento okres aktívny a nie je spustený výpadok, kliknutím ho deaktivujeme (toggle)
  if (activeDistrictFocus === distId && !activeDistrictOutage) {
    clearDistrictFocus();
    return;
  }

  // Ak bol aktívny iný výpadok, zastavíme ho
  if (activeDistrictOutage && activeDistrictOutage !== distId) {
    stopDistrictOutage(false);
  }

  activeDistrictFocus = distId;
  const dMeta = dict[distId];

  let villages = dMeta.villages || 0;
  if (!villages && typeof DISTRICT_COMPARISON_DATA !== 'undefined') {
    const comp = DISTRICT_COMPARISON_DATA.find(c => c.id === distId);
    if (comp) villages = comp.villages;
  }

  // 1. Zobrazenie banneru fokusu nad maticou
  const banner = document.getElementById('districtFocusBanner');
  const nameEl = document.getElementById('districtFocusName');
  const labelEl = document.getElementById('districtFocusLabel');
  const subEl = document.getElementById('districtFocusSub');
  const dotEl = document.getElementById('districtFocusDot');
  const btnOutageText = document.getElementById('btnToggleOutageText');

  if (banner && nameEl) {
    banner.className = "mb-4 p-3.5 rounded-xl bg-sky-50/95 border border-sky-200 text-sky-900 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm transition-all duration-200";
    if (dotEl) dotEl.className = "w-3 h-3 rounded-full bg-sky-500 animate-pulse shrink-0 mt-0.5 md:mt-0";
    if (labelEl) labelEl.textContent = "Fokus na okres:";
    nameEl.innerHTML = `<span class="font-extrabold text-sky-950">${dMeta.name} (${distId})</span> • <span class="text-sky-700 font-semibold">${dMeta.fte} FTE</span> • <span class="text-sky-700">Región ${dMeta.region}</span> • <span class="text-slate-600">${villages} obcí</span>`;
    if (subEl) subEl.innerHTML = `Stĺpec okresu je zvýraznený modrou. <span class="text-emerald-700 font-bold">Zelené bunky</span> s označením <span class="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold text-[9px] uppercase">ZÁSTUPCA</span> označujú určené zastupujúce pracoviská. Opätovným kliknutím na okres fokus zrušíte.`;
    if (btnOutageText) btnOutageText.textContent = "Simulovať výpadok";
    banner.classList.remove('hidden');
  }

  // 2. Zvýraznenie stĺpca v matici
  document.querySelectorAll('#coverageTable [data-dist]').forEach(el => {
    el.classList.remove('district-outage-active', 'district-outage-col', 'district-substitute-active');
    if (el.getAttribute('data-dist') === distId) {
      el.classList.add('district-focus-col');
      el.classList.remove('opacity-25');
    } else {
      el.classList.remove('district-focus-col');
      el.classList.add('opacity-25');
    }
  });

  // Odstránenie starých odznakov
  document.querySelectorAll('.subst-outage-chip, .subst-focus-badge').forEach(el => el.remove());

  // 3. Rozsvietenie buniek určených zástupcov pre agendy tohto okresu
  let substCount = 0;
  if (typeof AGENDAS !== 'undefined') {
    AGENDAS.forEach(ag => {
      // Ak okres túto agendu vykonáva / garantuje
      if (ag.coveredIn.includes(distId)) {
        const substFn = typeof getSubstitutionInfo === 'function' ? getSubstitutionInfo : (window.getSubstitutionInfo || null);
        if (substFn) {
          const subst = substFn(ag.id, distId);
          const partners = (subst && subst.allPartners && subst.allPartners.length > 0)
            ? subst.allPartners
            : (subst && subst.partnerId ? [{ id: subst.partnerId, name: subst.partnerName }] : []);

          partners.forEach(partner => {
            const tr = document.querySelector(`#matrixTableBody tr[data-agenda="${ag.id}"]`);
            if (tr) {
              const subTd = tr.querySelector(`td[data-dist="${partner.id}"]`);
              if (subTd) {
                subTd.classList.add('district-substitute-active');
                subTd.classList.remove('opacity-25');

                const badge = document.createElement('span');
                badge.className = 'subst-focus-badge';
                badge.textContent = 'ZÁSTUPCA';
                badge.title = `Určený zástupca: ${partner.name} (${partner.id}) pre agendu ${ag.id}`;
                subTd.appendChild(badge);
                substCount++;
              }
            }
          });
        }
      }
    });
  }

  // 4. Plynulý posun na maticu
  if (typeof scrollToSection === 'function') {
    scrollToSection('section-matrix');
  }

  // 5. Automatická synchronizácia s kaskádovým dispečingom
  const select = document.getElementById('dispatchDistrictSelect');
  if (select) {
    select.value = distId;
    if (typeof runDispatchSimulation === 'function') {
      runDispatchSimulation();
    }
  }

  // 6. Automatická synchronizácia s interaktívnou mapou
  if (typeof syncCascadeMapSelection === 'function') {
    syncCascadeMapSelection(distId);
  }

  if (typeof showToast === 'function') {
    showToast(`Aktivovaný fokus na okres ${dMeta.name} (${distId}) • ${substCount} určených zástupcov`, "info");
  }
}

function clearDistrictFocus() {
  if (activeDistrictOutage) {
    stopDistrictOutage(false);
  }

  activeDistrictFocus = null;

  const banner = document.getElementById('districtFocusBanner');
  if (banner) banner.classList.add('hidden');

  document.querySelectorAll('#coverageTable [data-dist]').forEach(el => {
    el.classList.remove('district-focus-col', 'district-outage-col', 'district-outage-active', 'district-substitute-active', 'opacity-25');
  });

  document.querySelectorAll('.subst-outage-chip, .subst-focus-badge').forEach(el => el.remove());

  if (typeof showToast === 'function') {
    showToast(`Fokus na okres bol zrušený`, "info");
  }
}

/* =========================================================================
   1A. SIMULÁCIA VÝPADKU OKRESU (OUTAGE SIMULATION & KASKÁDOVÁ KONTINUITA)
   ========================================================================= */
function toggleDistrictOutage() {
  if (!activeDistrictFocus) return;
  if (activeDistrictOutage === activeDistrictFocus) {
    stopDistrictOutage(true);
  } else {
    startDistrictOutage(activeDistrictFocus);
  }
}

function startDistrictOutage(distId) {
  const dict = typeof DISTRICT_DICT !== 'undefined' ? DISTRICT_DICT : (window.DISTRICT_DICT || {});
  if (!distId || !dict[distId]) return;

  activeDistrictOutage = distId;
  const dMeta = dict[distId];

  // 1. Aktualizácia banneru na taktický výstražný stav
  const banner = document.getElementById('districtFocusBanner');
  const nameEl = document.getElementById('districtFocusName');
  const labelEl = document.getElementById('districtFocusLabel');
  const subEl = document.getElementById('districtFocusSub');
  const dotEl = document.getElementById('districtFocusDot');
  const btnOutageText = document.getElementById('btnToggleOutageText');

  if (banner && nameEl) {
    banner.className = "mb-4 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md transition-all duration-200 animate-pulse";
    if (dotEl) dotEl.className = "w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0 mt-0.5 md:mt-0";
    if (labelEl) labelEl.textContent = "🚨 KRÍZOVÝ VÝPADOK:";
    nameEl.innerHTML = `<span class="font-extrabold text-rose-900">${dMeta.name} (${distId}) je nedostupné!</span>`;
    if (subEl) subEl.innerHTML = `<strong>Kaskádový plán aktivovaný:</strong> Zvýraznené <span class="text-emerald-700 font-bold">zelené bunky</span> v matici ukazujú, ktoré okresné pracoviská automaticky preberajú garantovanie jednotlivých agend.`;
    if (btnOutageText) btnOutageText.textContent = "Ukončiť výpadok";
    banner.classList.remove('hidden');
  }

  // 2. Štýlovanie vyradeného stĺpca v matici
  document.querySelectorAll('#coverageTable th[data-dist]').forEach(th => {
    if (th.getAttribute('data-dist') === distId) {
      th.classList.add('district-outage-active');
    } else {
      th.classList.remove('district-outage-active');
    }
  });

  document.querySelectorAll('#coverageTable td[data-dist]').forEach(td => {
    if (td.getAttribute('data-dist') === distId) {
      td.classList.add('district-outage-col');
      td.classList.remove('opacity-25');
    } else {
      td.classList.remove('district-outage-col');
      td.classList.add('opacity-25');
    }
  });

  // 3. Nájdenie a rozsvietenie zastupujúcich okresov pre každú agendu
  document.querySelectorAll('.subst-outage-chip').forEach(el => el.remove());

  let substCount = 0;
  if (typeof AGENDAS !== 'undefined') {
    AGENDAS.forEach(ag => {
      // Ak okres garantuje danú agendu
      if (ag.coveredIn.includes(distId)) {
        if (typeof getSubstitutionInfo === 'function') {
          const subst = getSubstitutionInfo(ag.id, distId);
          if (subst && subst.partnerId) {
            const tr = document.querySelector(`#matrixTableBody tr[data-agenda="${ag.id}"]`);
            if (tr) {
              const subTd = tr.querySelector(`td[data-dist="${subst.partnerId}"]`);
              if (subTd) {
                subTd.classList.add('district-substitute-active');
                subTd.classList.remove('opacity-25');

                const chip = document.createElement('span');
                chip.className = 'subst-outage-chip';
                chip.textContent = `PREBERÁ`;
                chip.title = `Pracovisko ${subst.partnerName} (${subst.partnerId}) preberá agendu ${ag.id} za výpadok ${distId}`;
                subTd.appendChild(chip);
                substCount++;
              }
            }
          }
        }
      }
    });
  }

  if (typeof showToast === 'function') {
    showToast(`🚨 Simulácia výpadku okresu ${dMeta.name}: Aktivovaných ${substCount} zastupujúcich garantov`, "warning");
  }
}

function stopDistrictOutage(notify = true) {
  activeDistrictOutage = null;

  // Odstránenie výpadkových a zastupujúcich štýlov
  document.querySelectorAll('#coverageTable th.district-outage-active').forEach(el => {
    el.classList.remove('district-outage-active');
  });
  document.querySelectorAll('#coverageTable td.district-outage-col').forEach(el => {
    el.classList.remove('district-outage-col');
  });
  document.querySelectorAll('#coverageTable td.district-substitute-active').forEach(el => {
    el.classList.remove('district-substitute-active');
  });
  document.querySelectorAll('.subst-outage-chip, .subst-focus-badge').forEach(el => el.remove());

  // Ak je stále aktívny fokus, obnovíme štandardný fokus a rozsvietenie zástupcov
  if (activeDistrictFocus) {
    const focusId = activeDistrictFocus;
    activeDistrictFocus = null;
    setDistrictFocus(focusId);
  }

  if (notify && typeof showToast === 'function') {
    showToast(`Simulácia výpadku bola ukončená`, "info");
  }
}

window.setDistrictFocus = setDistrictFocus;
window.clearDistrictFocus = clearDistrictFocus;
window.toggleDistrictOutage = toggleDistrictOutage;
window.startDistrictOutage = startDistrictOutage;
window.stopDistrictOutage = stopDistrictOutage;
window.showDistrictHeaderTooltip = showDistrictHeaderTooltip;
window.moveDistrictHeaderTooltip = moveDistrictHeaderTooltip;
window.hideDistrictHeaderTooltip = hideDistrictHeaderTooltip;
window.initDistrictHeaderTooltips = initDistrictHeaderTooltips;
