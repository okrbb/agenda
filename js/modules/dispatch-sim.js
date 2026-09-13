/* =========================================================================
   DISPATCH SIMULATION & TRAVEL-TIME CALCULATOR MODULE - 2026 TACTICAL HUD
   Kalkulátor dojazdových časov, taktické pravidlá, speed-metere a simulácia zásahu
   ========================================================================= */

function addMapLogEntry(text, type = 'neutral') {
  const logs = document.getElementById('mapMissionLogs');
  if (!logs) return;

  const time = new Date().toLocaleTimeString('sk-SK');
  const item = document.createElement('div');
  const tone = type === 'rose'
    ? 'border-rose-200 bg-rose-50/80 text-rose-800'
    : type === 'cyan'
      ? 'border-sky-200 bg-sky-50/80 text-sky-800'
      : type === 'emerald'
        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
        : 'border-slate-200 bg-slate-50/80 text-slate-600';

  item.className = `rounded-xl border p-2.5 shadow-sm ${tone}`;
  item.innerHTML = `
    <div class="flex items-start gap-2">
      <span class="text-[10px] text-slate-500 pt-0.5 font-mono-code">${time}</span>
      <span class="flex-1 leading-relaxed text-xs">${text}</span>
    </div>
  `;

  logs.prepend(item);
  while (logs.children.length > 12) {
    logs.removeChild(logs.lastChild);
  }
}

function renderTravelMatrixTable(selectedDistrict = "KA") {
  const tbody = document.getElementById('travelMatrixBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  ORDERED_ROWS.forEach(rowId => {
    const rowMeta = DISTRICT_DICT[rowId];
    const isSelectedRow = (rowId === selectedDistrict);
    const tr = document.createElement('tr');
    tr.className = `${isSelectedRow ? 'bg-sky-50 font-semibold ring-1 ring-sky-400' : 'hover:bg-slate-50'} transition`;

    const th = document.createElement('th');
    th.className = `p-2 text-left sticky left-0 z-20 ${isSelectedRow ? 'bg-sky-100 text-sky-950 font-bold' : 'bg-white text-slate-800 font-medium'} border-r border-slate-300 text-xs shadow-sm`;
    th.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${rowMeta.name}</span>
        <span class="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-normal">${rowId}</span>
      </div>
    `;
    tr.appendChild(th);

    ORDERED_COLS.forEach(colId => {
      const isSelectedCol = (colId === selectedDistrict);
      const cellData = getPairData(rowId, colId);

      const tdKm = document.createElement('td');
      const tdTime = document.createElement('td');
      tdKm.className = "p-1 border-r border-slate-200";
      tdTime.className = "p-1 border-r border-slate-300 font-mono-code";

      if (cellData) {
        tdKm.textContent = cellData.km;
        tdTime.textContent = cellData.time;

        if (cellData.fast) {
          tdKm.className += " bg-emerald-100/80 text-emerald-900 font-semibold";
          tdTime.className += " bg-emerald-100/80 text-emerald-900 font-bold";
        } else if (cellData.slow) {
          tdKm.className += " bg-amber-100/90 text-amber-950 font-bold";
          tdTime.className += " bg-amber-100/90 text-amber-950 font-bold";
        } else if (isSelectedRow || isSelectedCol) {
          tdKm.className += " bg-sky-50 text-sky-900";
          tdTime.className += " bg-sky-50 text-sky-900 font-medium";
        }
      } else {
        tdKm.innerHTML = `<span class="text-slate-300">-</span>`;
        tdTime.innerHTML = `<span class="text-slate-300">-</span>`;
        if (isSelectedRow || isSelectedCol) {
          tdKm.className += " bg-sky-50/50";
          tdTime.className += " bg-sky-50/50";
        }
      }

      tr.appendChild(tdKm);
      tr.appendChild(tdTime);
    });

    tbody.appendChild(tr);
  });
}

function resetDispatchSelection() {
  const select = document.getElementById('dispatchDistrictSelect');
  if (select) {
    select.value = '';
  }

  mapState.selectedDistrictId = null;
  mapState.hoveredDistrictId = null;
  mapState.activeConvoys = [];
  mapState.burstParticles = [];
  mapState.shockwaves = [];
  mapState.wavePulse = 0;
  mapState.arrivedCount = 0;
  mapState.totalDispatched = 0;

  const selectedName = document.getElementById('mapSelectedDistrictName');
  if (selectedName) {
    selectedName.textContent = 'Nevybraný okres';
  }

  const selectedMeta = document.getElementById('mapSelectedDistrictMeta');
  if (selectedMeta) {
    selectedMeta.innerHTML = '<div class="text-slate-500 italic">Vyberte okres na mape alebo z rozbaľovacieho zoznamu.</div>';
  }

  const selectedBadge = document.getElementById('mapSelectedDistrictBadge');
  if (selectedBadge) {
    selectedBadge.textContent = '—';
  }

  const neighborsList = document.getElementById('mapNeighborsList');
  if (neighborsList) {
    neighborsList.innerHTML = '<span class="text-[11px] text-slate-500 italic">Žiadny vybraný okres</span>';
  }

  const mapGrid = document.getElementById('mapDistrictGrid');
  if (mapGrid) {
    const buttons = Array.from(mapGrid.querySelectorAll('.district-map-btn'));
    buttons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
  }

  const metaBox = document.getElementById('dispatchDistrictMeta');
  if (metaBox) {
    metaBox.innerHTML = '';
  }

  const resultBox = document.getElementById('dispatchResultBox');
  if (resultBox) {
    resultBox.innerHTML = '';
  }

  const rankedBox = document.getElementById('dispatchRankedRoutes');
  if (rankedBox) {
    rankedBox.innerHTML = '';
  }
  currentRankedRoutesData = [];

  if (typeof renderCascadeMap === 'function') {
    renderCascadeMap();
  }
}

function runDispatchSimulation() {
  const select = document.getElementById('dispatchDistrictSelect');
  if (!select) return;
  const distId = select.value;

  if (!distId) {
    resetDispatchSelection();
    return;
  }

  const targetMeta = DISTRICT_DICT[distId];
  if (!targetMeta) return;

  mapState.selectedDistrictId = distId;
  syncCascadeMapSelection(distId);
  launchCascadeConvoys(distId);

  const metaBox = document.getElementById('dispatchDistrictMeta');
  if (metaBox) {
    metaBox.innerHTML = `
      <div class="flex justify-between">
        <span class="text-slate-500">Príslušnosť k regiónu:</span>
        <span class="font-bold text-slate-800">${targetMeta.region}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">Personálna kapacita:</span>
        <span class="font-bold text-slate-800">${targetMeta.fte} FTE</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">Dojazd z krajského sídla (BB):</span>
        <span class="font-bold ${distId === 'RA' ? 'text-amber-700' : 'text-slate-800'}">
          ${distId === 'BB' ? '0 min (v sídle)' : (getPairData(distId, 'BB') ? getPairData(distId, 'BB').time + ' (' + getPairData(distId, 'BB').km + ' km)' : '-')}
        </span>
      </div>
    `;
  }

  const availableRoutes = [];
  Object.keys(DISTRICT_DICT).forEach(otherId => {
    if (otherId === distId) return;
    const pair = getPairData(distId, otherId);
    if (pair) {
      const otherMeta = DISTRICT_DICT[otherId];
      const isSameRegion = (otherMeta.regionId === targetMeta.regionId);
      availableRoutes.push({
        id: otherId,
        name: otherMeta.name,
        region: otherMeta.region,
        regionId: otherMeta.regionId,
        fte: otherMeta.fte,
        isSameRegion: isSameRegion,
        km: pair.km,
        time: pair.time,
        minutes: parseTimeToMinutes(pair.time),
        fast: pair.fast,
        slow: pair.slow
      });
    }
  });

  availableRoutes.sort((a, b) => a.minutes - b.minutes);

  const bestRegional = availableRoutes.find(r => r.isSameRegion);
  const bestCrossBorder = availableRoutes.find(r => !r.isSameRegion);

  const ruleData = DISPATCH_TACTICAL_RULES[distId] || {
    decision: `AKTIVOVAŤ NAJRÝCHLEJŠIU PODPORU (${availableRoutes[0]?.name})`,
    primaryDistrict: availableRoutes[0]?.id || "BB",
    reason: "Nasadzuje sa pracovisko s najkratším preukázateľným dojazdovým časom."
  };

  // Taktické rozhodnutie a štýl podľa stupňa kaskády
  const curLvl = mapState.cascadeLevel || 2;
  let hudDecision = ruleData.decision;
  let hudReason = ruleData.reason;
  let hudBadgeClass = "bg-sky-100 text-sky-800 border-sky-200";
  let hudBadgeText = "2. STUPEŇ KASKÁDY (Regionálna podpora)";
  let hudCardBorder = "border-sky-200 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/40";
  let beaconColor = "bg-sky-600";
  let beaconPulseColor = "bg-sky-400";
  let textColor = "text-sky-700";

  if (curLvl === 1) {
    const regionalDistricts = Object.keys(DISTRICT_DICT).filter(id => id !== distId && DISTRICT_DICT[id].regionId === targetMeta.regionId);
    const regionalNames = regionalDistricts.map(id => `${DISTRICT_DICT[id].name} (${id})`).join(', ');
    hudDecision = `LOKÁLNY ZÁSAH PRACOVISKOM ${distId}`;
    hudReason = `Udalosť rieši výhradne konkrétny okres ${targetMeta.name} (${targetMeta.fte} FTE). Okresy v danom regióne ${targetMeta.region} (${regionalNames || 'žiadne ďalšie'}) sú v pohotovosti a pripravené pomôcť, zatiaľ však nevysielajú posily. Ostatné regióny kraja nie sú aktivované ani zvýraznené.`;
    hudBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
    hudBadgeText = "1. STUPEŇ KASKÁDY (Lokálne sily)";
    hudCardBorder = "border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40";
    beaconColor = "bg-emerald-600";
    beaconPulseColor = "bg-emerald-400";
    textColor = "text-emerald-700";
  } else if (curLvl === 3) {
    hudDecision = `CELOKRAJSKÁ MOBILIZÁCIA VŠETKÝCH 4 REGIÓNOV`;
    hudReason = `Mimoriadna udalosť krajského významu. Mobilizuje sa celý BB kraj a posily zo všetkých 13 okresov BBK fázované do 3 vĺn (I. vlna vlastný región, II. vlna susedské regióny, III. vlna celý kraj).`;
    hudBadgeClass = "bg-purple-100 text-purple-900 border-purple-300";
    hudBadgeText = "3. STUPEŇ KASKÁDY (Celokrajská výpomoc)";
    hudCardBorder = "border-purple-300 bg-gradient-to-br from-white via-purple-50/40 to-rose-50/40 ring-1 ring-purple-400/50";
    beaconColor = "bg-purple-700";
    beaconPulseColor = "bg-purple-500";
    textColor = "text-purple-800";
  }

  const resultBox = document.getElementById('dispatchResultBox');
  if (resultBox) {
    resultBox.innerHTML = `
      <!-- Porovnávacia karta (Bento panel) -->
      <div class="bento-panel p-4 flex flex-col justify-between">
        <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Porovnanie dojazdov do ${distId}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">${availableRoutes.length} trás</span>
            </div>
            
            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div class="text-slate-500 text-[11px] font-medium flex justify-between">
                  <span>Vlastný región (${targetMeta.region}):</span>
                  <span class="font-bold text-slate-800">${bestRegional ? bestRegional.name : 'Iba vlastné sily'}</span>
                </div>
                <div class="text-sm font-extrabold text-slate-900 mt-0.5 font-mono-code">
                  ${bestRegional ? bestRegional.time + ' (' + bestRegional.km + ' km)' : 'Bez ďalšieho pracoviska'}
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 shadow-sm">
                <div class="text-sky-800 text-[11px] font-medium flex justify-between">
                  <span>Najrýchlejšia susedná výpomoc:</span>
                  <span class="font-bold text-sky-950">${bestCrossBorder ? bestCrossBorder.name + ' (' + bestCrossBorder.region + ')' : 'Nie je potrebná'}</span>
                </div>
                <div class="text-sm font-extrabold text-sky-950 mt-0.5 font-mono-code">
                  ${bestCrossBorder ? bestCrossBorder.time + ' (' + bestCrossBorder.km + ' km)' : '-'}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sídlo kraja Banská Bystrica:</span>
            <span class="font-bold text-slate-800 font-mono-code">${distId === 'BB' ? 'V sídle' : (getPairData(distId, 'BB') ? getPairData(distId, 'BB').time : '-')}</span>
          </div>
        </div>

        <!-- Karta taktického rozhodnutia (Tactical HUD Card s majákom) -->
        <div class="bento-panel p-4 flex flex-col justify-between ${hudCardBorder} shadow-md">
          <div>
            <div class="flex items-center space-x-2 ${textColor} font-bold text-xs uppercase tracking-wider mb-2">
              <span class="relative flex h-3 w-3">
                <span class="beacon-pulse absolute inline-flex h-full w-full rounded-full ${beaconPulseColor} opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 ${beaconColor}"></span>
              </span>
              <span>Rozhodnutie:</span>
            </div>
            <div class="text-sm font-extrabold text-slate-900 leading-snug">${hudDecision}</div>
            <p class="text-xs text-slate-700 mt-2.5 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              ${hudReason}
            </p>
          </div>
          
          <div class="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Režim nasadenia:</span>
            <span class="px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider text-[10px] ${hudBadgeClass}">${hudBadgeText}</span>
          </div>
        </div>
      `;
  }

  renderDispatchResults(distId, ruleData, availableRoutes);
}

function setCascadeLevel(level, showNotification = true) {
  const lvlNum = parseInt(level, 10) || 1;
  mapState.cascadeLevel = lvlNum;

  // Aktualizácia tlačidiel v simulátore
  [1, 2, 3].forEach(l => {
    const btn = document.getElementById(`btnCascadeLvl${l}`);
    if (btn) {
      if (l === lvlNum) {
        btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5 ${l === 1 ? 'bg-emerald-600 text-white shadow-emerald-200' : (l === 2 ? 'bg-sky-600 text-white shadow-sky-200' : 'bg-purple-700 text-white ring-2 ring-purple-400 shadow-purple-200')
          }`;
      } else {
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5";
      }
    }

    // Prehľadové karty kaskády
    const card = document.getElementById(`cascadeCardLvl${l}`);
    if (card) {
      if (l === lvlNum) {
        card.classList.add('ring-4', l === 1 ? 'ring-emerald-400' : (l === 2 ? 'ring-sky-400' : 'ring-purple-500'), 'shadow-lg');
      } else {
        card.classList.remove('ring-4', 'ring-emerald-400', 'ring-sky-400', 'ring-purple-500', 'shadow-lg');
      }
    }
  });

  // Štítok nad mapou
  const badge = document.getElementById('mapCascadeLevelBadge');
  if (badge) {
    if (lvlNum === 1) {
      badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600"></span> 1. STUPEŇ: Lokálne sily';
    } else if (lvlNum === 2) {
      badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-sm";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-sky-600"></span> 2. STUPEŇ: Regionálna podpora';
    } else {
      badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-950 border border-purple-300 shadow-sm animate-pulse";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-700"></span> 3. STUPEŇ: CELOKRAJSKÁ MOBILIZÁCIA';
    }
  }

  runDispatchSimulation();
  if (showNotification && typeof showToast === 'function') {
    showToast(`Aktivovaný ${lvlNum}. stupeň kaskády: ${lvlNum === 1 ? 'Lokálne sily' : (lvlNum === 2 ? 'Regionálna podpora' : 'Celokrajská mobilizácia')}`, lvlNum === 3 ? "warning" : "info");
  }
}

window.setCascadeLevel = setCascadeLevel;

let currentRankedRoutesData = [];
let currentRoutesFilter = 'all';

function setDispatchRouteFilter(mode) {
  currentRoutesFilter = mode;
  const btnAll = document.getElementById('btnFilterRoutesAll');
  const btnFast = document.getElementById('btnFilterRoutesFast');

  if (mode === 'fast') {
    if (btnFast) {
      btnFast.className = "px-2.5 py-1 rounded-md bg-white text-emerald-800 font-bold shadow-sm transition flex items-center space-x-1";
    }
    if (btnAll) {
      btnAll.className = "px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition";
    }
  } else {
    if (btnAll) {
      btnAll.className = "px-2.5 py-1 rounded-md bg-white text-slate-800 font-bold shadow-sm transition";
    }
    if (btnFast) {
      btnFast.className = "px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition flex items-center space-x-1";
    }
  }

  renderRankedRoutesCards();
}

function renderRankedRoutesCards() {
  const rankedBox = document.getElementById('dispatchRankedRoutes');
  if (!rankedBox) return;
  rankedBox.innerHTML = '';

  if (!currentRankedRoutesData || currentRankedRoutesData.length === 0) {
    rankedBox.innerHTML = '<div class="col-span-3 text-xs text-slate-500 italic p-3">Vyberte okres pre zobrazenie dojazdových trás.</div>';
    return;
  }

  const routesToDisplay = currentRoutesFilter === 'fast'
    ? currentRankedRoutesData.filter(r => r.minutes <= 45)
    : currentRankedRoutesData;

  if (routesToDisplay.length === 0) {
    rankedBox.innerHTML = `
      <div class="col-span-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        <i class="fa-solid fa-clock-rotate-left text-slate-400 mr-1.5"></i>
        Pre tento okres nie sú k dispozícii žiadne dojazdy do 45 minút. Všetky ostatné okresy sú v kategórii dlhších dojazdov.
      </div>
    `;
    return;
  }

  routesToDisplay.forEach((r, idx) => {
    const pill = document.createElement('div');
    const isTopPick = (idx === 0);

    // Speed-meter výpočet (relatívne k 90 min)
    const pct = Math.min(100, Math.max(8, (r.minutes / 90) * 100));
    const barColor = r.minutes <= 25
      ? '#10b981'
      : r.minutes <= 45
        ? '#0ea5e9'
        : r.minutes <= 75
          ? '#f59e0b'
          : '#ef4444';

    pill.className = `p-3 rounded-xl border transition flex flex-col justify-between ${isTopPick
      ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-400/50'
      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`;

    pill.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2.5">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${isTopPick ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
      }">
            ${idx + 1}
          </div>
          <div>
            <div class="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>${r.name}</span>
              <span class="font-mono-code text-[11px] text-slate-400">(${r.id})</span>
              ${r.isSameRegion
        ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Región</span>'
        : '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Sused</span>'
      }
            </div>
            <div class="text-[11px] text-slate-500">${r.region} • ${r.km} km</div>
          </div>
        </div>

        <div class="text-right">
          <span class="font-extrabold font-mono-code ${r.fast ? 'text-emerald-700' : (r.slow ? 'text-amber-700' : 'text-slate-800')} text-xs">
            ${r.time}
          </span>
          <span class="block text-[10px] text-slate-400 font-normal font-mono-code">${Math.round(r.minutes)} min</span>
        </div>
      </div>

      <!-- Lineárny Speed-Meter -->
      <div class="speed-meter-track w-full mt-2">
        <div class="speed-meter-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
      </div>
    `;
    rankedBox.appendChild(pill);
  });
}

// Global exposure
window.setDispatchRouteFilter = setDispatchRouteFilter;

function renderDispatchResults(distId, ruleData, availableRoutes) {
  currentRankedRoutesData = availableRoutes || [];
  renderRankedRoutesCards();
  renderTravelMatrixTable(distId);
}
