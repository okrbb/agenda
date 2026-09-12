/* =========================================================================
   DISPATCH SIMULATION & TRAVEL-TIME CALCULATOR MODULE
   Kalkulátor dojazdových časov, taktické pravidlá a simulácia zásahu
   ========================================================================= */

function addMapLogEntry(text, type = 'neutral') {
  const logs = document.getElementById('mapMissionLogs');
  if (!logs) return;

  const time = new Date().toLocaleTimeString('sk-SK');
  const item = document.createElement('div');
  const tone = type === 'rose'
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : type === 'cyan'
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : type === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  item.className = `rounded-lg border p-2 ${tone}`;
  item.innerHTML = `
    <div class="flex items-start gap-2">
      <span class="text-[10px] text-slate-500 pt-0.5">${time}</span>
      <span class="flex-1 leading-relaxed">${text}</span>
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
    tr.className = `${isSelectedRow ? 'bg-sky-100 font-semibold ring-2 ring-sky-500/50' : 'hover:bg-slate-50'} transition`;

    const th = document.createElement('th');
    th.className = `p-2 text-left sticky left-0 z-20 ${isSelectedRow ? 'bg-sky-200 text-sky-950 font-bold' : 'bg-white text-slate-800 font-medium'} border-r border-slate-300 text-xs shadow-sm`;
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
          tdKm.className += " bg-emerald-100 text-emerald-900 font-semibold";
          tdTime.className += " bg-emerald-100 text-emerald-900 font-bold";
        } else if (cellData.slow) {
          tdKm.className += " bg-amber-300 text-amber-950 font-bold";
          tdTime.className += " bg-amber-300 text-amber-950 font-bold";
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

  const resultBox = document.getElementById('dispatchResultBox');
  if (resultBox) {
    resultBox.innerHTML = `
      <!-- Porovnávacia karta -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Porovnanie dojazdov do ${distId}</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">${availableRoutes.length} meraných trás</span>
          </div>
          
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div class="text-slate-500 text-[11px] font-medium flex justify-between">
                <span>Vlastný región (${targetMeta.region}):</span>
                <span class="font-bold text-slate-800">${bestRegional ? bestRegional.name : 'Iba vlastné sily'}</span>
              </div>
              <div class="text-sm font-extrabold text-slate-900 mt-0.5">
                ${bestRegional ? bestRegional.time + ' (' + bestRegional.km + ' km)' : 'Bez ďalšieho pracoviska'}
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-sky-50 border border-sky-200 shadow-sm">
              <div class="text-sky-800 text-[11px] font-medium flex justify-between">
                <span>Najrýchlejšia susedná výpomoc:</span>
                <span class="font-bold text-sky-900">${bestCrossBorder ? bestCrossBorder.name + ' (' + bestCrossBorder.region + ')' : 'Nie je potrebná'}</span>
              </div>
              <div class="text-sm font-extrabold text-sky-950 mt-0.5">
                ${bestCrossBorder ? bestCrossBorder.time + ' (' + bestCrossBorder.km + ' km)' : '-'}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Sídlo kraja Banská Bystrica:</span>
          <span class="font-semibold text-slate-800">${distId === 'BB' ? 'V sídle' : (getPairData(distId, 'BB') ? getPairData(distId, 'BB').time : '-')}</span>
        </div>
      </div>

      <!-- Karta taktického rozhodnutia -->
      <div class="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 flex flex-col justify-between shadow-md">
        <div>
          <div class="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <i class="fa-solid fa-route text-amber-400"></i>
            <span>Rozhodnutie:</span>
          </div>
          <div class="text-sm font-extrabold text-white leading-snug">${ruleData.decision}</div>
          <p class="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            ${ruleData.reason}
          </p>
        </div>
        
        <div class="mt-3 pt-2.5 border-t border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Odporúčanie aktivovať</span>
          <span class="text-sky-400 font-semibold uppercase tracking-wider">2. STUPEŇ KASKÁDY</span>
        </div>
      </div>
    `;
  }

  const rankedBox = document.getElementById('dispatchRankedRoutes');
  if (rankedBox) {
    rankedBox.innerHTML = '';
    availableRoutes.forEach((r, idx) => {
      const pill = document.createElement('div');
      const isTopPick = (idx === 0);
      pill.className = `p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${isTopPick ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-white'
        }`;

      pill.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${isTopPick ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
        }">
            ${idx + 1}
          </div>
          <div>
            <div class="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>${r.name} (${r.id})</span>
              ${r.isSameRegion
          ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-800">Región</span>'
          : '<span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">Sused</span>'
        }
            </div>
            <div class="text-[11px] text-slate-500">${r.region} • ${r.km} km</div>
          </div>
        </div>

        <div class="text-right">
          <span class="font-extrabold font-mono-code ${r.fast ? 'text-emerald-700' : (r.slow ? 'text-amber-700' : 'text-slate-800')} text-xs">
            ${r.time}
          </span>
          <span class="block text-[10px] text-slate-400 font-normal">${Math.round(r.minutes)} min</span>
        </div>
      `;
      rankedBox.appendChild(pill);
    });
  }

  renderTravelMatrixTable(distId);
}
