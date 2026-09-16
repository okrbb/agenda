/* =========================================================================
   DISPATCH SIMULATION & TRAVEL-TIME CALCULATOR MODULE - 2026 TACTICAL HUD
   Kalkulátor dojazdových časov, taktické pravidlá, speed-metere a simulácia zásahu
   ========================================================================= */

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

// Inicializácia taktických stavov v mapState
if (typeof mapState !== 'undefined') {
  if (!mapState.busyDistricts) mapState.busyDistricts = new Set();
  if (typeof mapState.winterMode === 'undefined') mapState.winterMode = false;
}

function setWinterMode(enable) {
  if (typeof mapState !== 'undefined') {
    mapState.winterMode = !!enable;
  }

  const btnSummer = document.getElementById('btnSeasonSummer');
  const btnWinter = document.getElementById('btnSeasonWinter');
  const lbl = document.getElementById('winterModeStatusLabel');

  if (btnSummer && btnWinter) {
    if (mapState.winterMode) {
      btnWinter.className = "py-1.5 px-2.5 rounded-lg font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-sm flex items-center justify-center space-x-1.5 transition text-xs";
      btnSummer.className = "py-1.5 px-2.5 rounded-lg font-medium text-slate-600 hover:text-slate-800 flex items-center justify-center space-x-1.5 transition text-xs";
      if (lbl) lbl.innerHTML = '<span class="text-sky-700 font-bold flex items-center space-x-1"><i class="fa-regular fa-snowflake"></i><span>Zima (+20% hory)</span></span>';
      if (typeof showToast === 'function') {
        showToast("❄️ Aktivovaný zimný režim: trasy cez horské priechody (Zbojská, Štiavnica) prepočítané s prirážkou +20%", "info");
      }
    } else {
      btnSummer.className = "py-1.5 px-2.5 rounded-lg font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-sm flex items-center justify-center space-x-1.5 transition text-xs";
      btnWinter.className = "py-1.5 px-2.5 rounded-lg font-medium text-slate-600 hover:text-sky-800 flex items-center justify-center space-x-1.5 transition text-xs";
      if (lbl) lbl.textContent = "Štandard (Leto)";
      if (typeof showToast === 'function') {
        showToast("☀️ Nastavený letný štandardný režim ciest", "info");
      }
    }
  }

  if (typeof renderCascadeMap === 'function') {
    renderCascadeMap();
  }
  runDispatchSimulation();
}

function handleBusyDistrictChange(districtId) {
  if (typeof mapState !== 'undefined') {
    if (!mapState.busyDistricts) mapState.busyDistricts = new Set();
    mapState.busyDistricts.clear();
    if (districtId) {
      mapState.busyDistricts.add(districtId);
    }
  }

  const badge = document.getElementById('busyDistrictBadge');
  if (badge) {
    if (districtId) {
      badge.classList.remove('hidden');
      badge.innerHTML = `<i class="fa-solid fa-ban mr-1"></i>Okres ${districtId} nedostupný (viazaný vlastnou MU)`;
    } else {
      badge.classList.add('hidden');
    }
  }

  if (districtId && typeof showToast === 'function') {
    const meta = DISTRICT_DICT[districtId];
    showToast(`Okres ${meta ? meta.name : districtId} viazaný vlastnou MU: personál a technika nevyrážajú na výpomoc`, "warning");
  }

  if (typeof renderCascadeMap === 'function') {
    renderCascadeMap();
  }
  runDispatchSimulation();
}

function resetTacticalConditions() {
  if (typeof mapState !== 'undefined') {
    mapState.winterMode = false;
    if (mapState.busyDistricts) mapState.busyDistricts.clear();
  }

  const select = document.getElementById('busyDistrictSelect');
  if (select) select.value = '';

  const badge = document.getElementById('busyDistrictBadge');
  if (badge) badge.classList.add('hidden');

  const btnSummer = document.getElementById('btnSeasonSummer');
  const btnWinter = document.getElementById('btnSeasonWinter');
  const lbl = document.getElementById('winterModeStatusLabel');
  if (btnSummer && btnWinter) {
    btnSummer.className = "py-1.5 px-2.5 rounded-lg font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-sm flex items-center justify-center space-x-1.5 transition text-xs";
    btnWinter.className = "py-1.5 px-2.5 rounded-lg font-medium text-slate-600 hover:text-sky-800 flex items-center justify-center space-x-1.5 transition text-xs";
    if (lbl) lbl.textContent = "Štandard (Leto)";
  }

  if (typeof showToast === 'function') {
    showToast("Taktické podmienky boli resetované na predvolené.", "info");
  }

  if (typeof renderCascadeMap === 'function') {
    renderCascadeMap();
  }
  runDispatchSimulation();
}

window.setWinterMode = setWinterMode;
window.handleBusyDistrictChange = handleBusyDistrictChange;
window.resetTacticalConditions = resetTacticalConditions;

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
    const pairBB = getPairData(distId, 'BB');
    let bbDisplayTime = '-';
    if (distId === 'BB') {
      bbDisplayTime = '0 min (v sídle)';
    } else if (pairBB) {
      let bbMins = parseTimeToMinutes(pairBB.time);
      if (mapState.winterMode && pairBB.mountainPass) bbMins = Math.round(bbMins * 1.20);
      const bbH = Math.floor(bbMins / 60);
      const bbM = Math.round(bbMins % 60);
      bbDisplayTime = `${bbH > 0 ? bbH + ':' + (bbM < 10 ? '0' : '') + bbM + ' h' : bbM + ' min'} (${pairBB.km} km)`;
    }

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
        <span class="text-slate-500">Dojazd:</span>
        <span class="font-bold ${distId === 'RA' ? 'text-amber-700' : 'text-slate-800'}">
          ${bbDisplayTime}
        </span>
      </div>
    `;
  }

  const availableRoutes = [];
  const isWinter = !!(mapState && mapState.winterMode);
  const busySet = (mapState && mapState.busyDistricts) ? mapState.busyDistricts : new Set();

  Object.keys(DISTRICT_DICT).forEach(otherId => {
    if (otherId === distId) return;
    const pair = getPairData(distId, otherId);
    if (pair) {
      const otherMeta = DISTRICT_DICT[otherId];
      const isSameRegion = (otherMeta.regionId === targetMeta.regionId);
      const isBusy = busySet.has(otherId);
      const isMountain = !!pair.mountainPass;

      const baseMins = parseTimeToMinutes(pair.time);
      let effectiveMins = baseMins;
      let winterDelay = 0;

      if (isWinter) {
        if (isMountain) {
          winterDelay = Math.round(baseMins * 0.20); // +20% cez horské priechody
          effectiveMins += winterDelay;
        } else {
          winterDelay = Math.round(baseMins * 0.05); // +5% nížinný zimný tranzit
          effectiveMins += winterDelay;
        }
      }

      const h = Math.floor(effectiveMins / 60);
      const m = Math.round(effectiveMins % 60);
      const formattedTime = (h === 0) ? `${m} min` : `${h}:${m < 10 ? '0' : ''}${m} h`;

      availableRoutes.push({
        id: otherId,
        name: otherMeta.name,
        region: otherMeta.region,
        regionId: otherMeta.regionId,
        fte: otherMeta.fte,
        isSameRegion: isSameRegion,
        km: pair.km,
        baseTime: pair.time,
        baseMinutes: baseMins,
        time: formattedTime,
        minutes: effectiveMins,
        effectiveMinutes: effectiveMins,
        mountainPass: isMountain,
        passName: pair.passName || null,
        winterDelay: winterDelay,
        isBusy: isBusy,
        fast: effectiveMins <= 45,
        slow: effectiveMins > 90
      });
    }
  });

  // Zoradenie: primárne dostupné okresy zoradené podľa času, viazané (nedostupné) okresy na koniec
  availableRoutes.sort((a, b) => {
    if (a.isBusy !== b.isBusy) {
      return a.isBusy ? 1 : -1;
    }
    return a.effectiveMinutes - b.effectiveMinutes;
  });

  // Primárne vyberáme nezaneprázdnené pracoviská; ak sú všetky viazané, berieme zoradené
  const bestRegional = availableRoutes.find(r => r.isSameRegion && !r.isBusy) || availableRoutes.find(r => r.isSameRegion);
  const bestCrossBorder = availableRoutes.find(r => !r.isSameRegion && !r.isBusy) || availableRoutes.find(r => !r.isSameRegion);

  const topPick = availableRoutes[0];
  const normalSorted = [...availableRoutes].sort((a, b) => a.baseMinutes - b.baseMinutes);
  const normalFastest = normalSorted[0];

  // Taktické rozhodnutie a štýl podľa stupňa kaskády
  const curLvl = mapState.cascadeLevel || 2;
  let hudDecision = "";
  let hudReason = "";
  let hudBadgeClass = "bg-sky-100 text-sky-900 border-sky-300";
  let hudBadgeText = "2. STUPEŇ KASKÁDY (Regionálna podpora)";
  let hudCardBorder = "border-sky-300 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/40";
  let beaconColor = "bg-sky-600";
  let beaconPulseColor = "bg-sky-400";
  let textColor = "text-sky-800";

  if (curLvl === 1) {
    const regionalDistricts = Object.keys(DISTRICT_DICT).filter(id => id !== distId && DISTRICT_DICT[id].regionId === targetMeta.regionId);
    const regionalNames = regionalDistricts.map(id => `${DISTRICT_DICT[id].name} (${id})`).join(', ');
    hudDecision = `LOKÁLNY ZÁSAH PRACOVISKOM ${distId}`;
    hudReason = `Udalosť rieši výhradne konkrétny okres ${targetMeta.name} (${targetMeta.fte} FTE). Okresy v danom regióne ${targetMeta.region} (${regionalNames || 'žiadne ďalšie'}) sú v pohotovosti a pripravené pomôcť, zatiaľ však nevysielajú posily. Ostatné regióny kraja nie sú aktivované ani zvýraznené.`;
    hudBadgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300";
    hudBadgeText = "1. STUPEŇ KASKÁDY (Lokálne sily)";
    hudCardBorder = "border-emerald-300 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/40 ring-1 ring-emerald-400/40";
    beaconColor = "bg-emerald-600";
    beaconPulseColor = "bg-emerald-400";
    textColor = "text-emerald-800";
  } else if (curLvl === 3) {
    hudDecision = `CELOKRAJSKÁ MOBILIZÁCIA VŠETKÝCH 4 REGIÓNOV`;
    hudReason = `Mimoriadna udalosť krajského významu. Mobilizuje sa celý BB kraj a posily zo všetkých 13 okresov BBK fázované do 3 vĺn (I. vlna vlastný región, II. vlna susedské regióny, III. vlna celý kraj).`;
    hudBadgeClass = "bg-rose-100 text-rose-900 border-rose-300";
    hudBadgeText = "3. STUPEŇ KASKÁDY (Celokrajská výpomoc)";
    hudCardBorder = "border-rose-300 bg-gradient-to-br from-white via-rose-50/40 to-pink-50/40 ring-1 ring-rose-400/50";
    beaconColor = "bg-rose-600";
    beaconPulseColor = "bg-rose-400";
    textColor = "text-rose-800";
  } else {
    // 2. STUPEŇ KASKÁDY - Dynamické taktické vyhodnotenie
    const brRoute = availableRoutes.find(r => r.id === 'BR');
    const rsRoute = availableRoutes.find(r => r.id === 'RS');
    const ptRoute = availableRoutes.find(r => r.id === 'PT');

    const busyId = (busySet && busySet.size > 0) ? Array.from(busySet)[0] : null;
    const busyMeta = busyId ? DISTRICT_DICT[busyId] : null;
    const secondPick = availableRoutes.filter(r => !r.isBusy && r.id !== topPick?.id)[0];

    // Špecifický kľúčový prípad pre okres Revúca (RA) a Brezno
    if (distId === 'RA' && busySet.has('BR')) {
      if (isWinter) {
        hudDecision = `NÁHRADNÁ POSILA: AKTIVOVAŤ RIMAVSKÚ SOBOTU (${rsRoute?.time || '1:02 h'})`;
        hudReason = `⚠️ <strong>Pracovisko Brezno rieši vlastnú mimoriadnu udalosť</strong> (kapacity sú viazané lokálne a nevyrážajú na výpomoc) a horské sedlo <strong>Zbojská (I/72)</strong> má zimné zdržanie (+20%). Systém automaticky presmeroval primárnu výpomoc na južný koridor – <strong>Rimavská Sobota (${rsRoute?.time || '1:02 h'}, ${rsRoute?.km || 58} km, VÝCHOD)</strong>, 2. záloha Poltár (${ptRoute?.time || '1:08 h'}).`;
      } else {
        hudDecision = `NÁHRADNÁ POSILA: AKTIVOVAŤ RIMAVSKÚ SOBOTU (${rsRoute?.time || '1:00 h'})`;
        hudReason = `⚠️ <strong>Pracovisko Brezno rieši vlastnú mimoriadnu udalosť</strong> (kapacity sú viazané lokálne a nevyrážajú). Systém aktivuje ako primárnu dostupnú posilu <strong>Rimavskú Sobotu (${rsRoute?.time || '1:00 h'}, ${rsRoute?.km || 58} km, VÝCHOD)</strong>, záloha Poltár (${ptRoute?.time || '1:05 h'}).`;
      }
      hudCardBorder = "border-amber-300 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30";
      beaconColor = "bg-amber-600";
      beaconPulseColor = "bg-amber-400";
      textColor = "text-amber-800";
    } else if (busyId) {
      // DYNAMICKÝ SCENÁR: Ľubovoľný okres v kraji má vlastnú mimoriadnu udalosť
      hudCardBorder = "border-amber-300 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30";
      beaconColor = "bg-amber-600";
      beaconPulseColor = "bg-amber-400";
      textColor = "text-amber-800";

      if (distId === busyId) {
        // Zvolený zasiahnutý okres je sám vyťažený vlastnou MU
        hudDecision = `EXTERNÁ PODPORA PRE ${targetMeta.name.toUpperCase()} (KAPACITY VIAZANÉ)`;
        hudReason = `⚠️ Okresné pracovisko <strong>${targetMeta.name}</strong> rieši mimoriadnu udalosť na vlastnom území a jeho sily sú plne vyťažené. Výpomoc musí prísť z vonku. Ako primárna posila sa nasadzuje <strong>${topPick.name} (${topPick.time}, ${topPick.km} km, ${topPick.region})</strong>${secondPick ? `, 2. záloha ${secondPick.name} (${secondPick.time})` : ''}.`;
      } else if (normalFastest && normalFastest.isBusy) {
        // Najrýchlejšie susedné pracovisko má vlastnú MU -> Náhradná posila
        hudDecision = `NÁHRADNÁ POSILA: AKTIVOVAŤ ${topPick.name.toUpperCase()} (${topPick.time})`;
        hudReason = `⚠️ Najbližšie pracovisko <strong>${normalFastest.name} (${normalFastest.id})</strong> rieši vlastnú mimoriadnu udalosť a jeho kapacity sú viazané lokálne (nevyrážajú na výpomoc). Systém automaticky presmeroval primárnu pomoc na najbližšie voľné pracovisko <strong>${topPick.name} (${topPick.time}, ${topPick.km} km, ${topPick.region})</strong>${secondPick ? `, 2. záloha ${secondPick.name} (${secondPick.time})` : ''}.`;
      } else {
        // Iné pracovisko v kraji má MU (je vyradené z posíl)
        hudDecision = `VÝLUKA PRACOVISKA ${busyMeta.name.toUpperCase()}: AKTIVOVAŤ ${topPick.name.toUpperCase()} (${topPick.time})`;
        hudReason = `⚠️ Pracovisko <strong>${busyMeta.name} (${busyId})</strong> rieši vlastnú mimoriadnu udalosť a je vyradené z plánu výpomoci (kapacity viazané). Pre okres ${targetMeta.name} nasadzuje systém ako primárnu posilu <strong>${topPick.name} (${topPick.time}, ${topPick.km} km, ${topPick.region})</strong>${secondPick ? `, 2. záloha ${secondPick.name} (${secondPick.time})` : ''}.`;
      }

      if (isWinter && topPick && topPick.mountainPass) {
        hudReason += ` ❄️ Trasa posily navyše prechádza cez <strong>${topPick.passName || 'horský priechod'}</strong> so zimným zdržaním (+20%).`;
      }
    } else if (distId === 'RA') {
      // Štandardné podmienky pre RA bez viazanej MU
      if (isWinter) {
        hudDecision = `ZIMNÝ REŽIM: AKTIVOVAŤ RIMAVSKÚ SOBOTU (${rsRoute?.time || '1:02 h'})`;
        hudReason = `❄️ <strong>Zimný režim:</strong> Prechod cez horské sedlo <strong>Zbojská (cesta I/72)</strong> predlžuje dojazd z Brezna na <strong>${brRoute?.time || '1:04 h'}</strong>. Rýchlejšou a bezpečnejšou primárnou posilou z juhu sa stáva <strong>Rimavská Sobota (${rsRoute?.time || '1:02 h'}, ${rsRoute?.km || 58} km, VÝCHOD)</strong>.`;
        hudCardBorder = "border-sky-300 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30";
        beaconColor = "bg-sky-600";
        beaconPulseColor = "bg-sky-400";
        textColor = "text-sky-800";
      } else {
        hudDecision = "AKTIVOVAŤ BREZNO (53 min) ALEBO RIMAVSKÚ SOBOTU (1:00 h)";
        hudReason = "1. najbližší: Brezno (53 min, 50 km, SEVER) | 2. najbližší: Rimavská Sobota (1:00 h, 58 km, VÝCHOD). Sídlo kraja Banská Bystrica má kritický dojazd až 1:30 h (93 km).";
      }
    } else if (isWinter && topPick && topPick.mountainPass) {
      // Zimný režim pre horské trasy
      hudDecision = `ZIMNÝ REŽIM: AKTIVOVAŤ ${topPick.name.toUpperCase()} (${topPick.time})`;
      hudReason = `❄️ Trasa posily prechádza cez exponovaný horský úsek <strong>${topPick.passName || 'horský priechod'}</strong> (+20% zimná prirážka). Odporúča sa zvýšená opatrnosť výjazdovej skupiny.`;
      hudCardBorder = "border-sky-300 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30";
      beaconColor = "bg-sky-600";
      beaconPulseColor = "bg-sky-400";
      textColor = "text-sky-800";
    } else {
      // Bežné taktické pravidlo
      const defaultRule = DISPATCH_TACTICAL_RULES[distId];
      if (defaultRule) {
        hudDecision = defaultRule.decision;
        hudReason = defaultRule.reason;
      } else {
        hudDecision = `AKTIVOVAŤ ${topPick ? topPick.name.toUpperCase() : 'BB'} (${topPick ? topPick.time : ''})`;
        hudReason = `1. najbližšia podpora: <strong>${topPick.name} (${topPick.time}, ${topPick.km} km, ${topPick.region})</strong>${secondPick ? ` | 2. záložná podpora: <strong>${secondPick.name} (${secondPick.time}, ${secondPick.km} km, ${secondPick.region})</strong>` : ''}. Nasadzuje sa pracovisko s najkratším preukázateľným dojazdovým časom.`;
      }
    }
  }

  const resultBox = document.getElementById('dispatchResultBox');
  if (resultBox) {
    const isSpecialWinter = isWinter;
    const isSpecialBusy = busySet.size > 0;

    resultBox.innerHTML = `
      <!-- 1. Karta taktického rozhodnutia (Tactical HUD Card s majákom) -->
      <div class="bento-panel p-4 flex flex-col justify-between ${hudCardBorder} shadow-sm">
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

      <!-- 2. Porovnávacia karta dojazdov -->
      <div class="bento-panel p-4 flex flex-col justify-between shadow-sm">
        <div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Porovnanie dojazdov do ${distId}</span>
            <span class="text-[10px] text-slate-400 font-medium font-mono-code">${targetMeta.name}</span>
          </div>
          
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div class="text-slate-500 text-[11px] font-medium flex justify-between">
                <span>Vlastný región (${targetMeta.region}):</span>
                <span class="font-bold text-slate-800">${bestRegional ? bestRegional.name : 'Iba vlastné sily'}</span>
              </div>
              <div class="text-sm font-extrabold text-slate-900 mt-0.5 font-mono-code flex items-center justify-between">
                <span>${bestRegional ? bestRegional.time + ' (' + bestRegional.km + ' km)' : 'Bez ďalšieho pracoviska'}</span>
                ${bestRegional && bestRegional.isBusy ? '<span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">Vlastná MU</span>' : ''}
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 shadow-sm">
              <div class="text-sky-800 text-[11px] font-medium flex justify-between">
                <span>Najrýchlejšia susedná výpomoc:</span>
                <span class="font-bold text-sky-950">${bestCrossBorder ? bestCrossBorder.name + ' (' + bestCrossBorder.region + ')' : 'Nie je potrebná'}</span>
              </div>
              <div class="text-sm font-extrabold text-sky-950 mt-0.5 font-mono-code flex items-center justify-between">
                <span>${bestCrossBorder ? bestCrossBorder.time + ' (' + bestCrossBorder.km + ' km)' : '-'}</span>
                ${bestCrossBorder && bestCrossBorder.mountainPass && isWinter ? '<span class="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300">❄️ Horský prechod</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
          <div class="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sídlo kraja Banská Bystrica:</span>
            <span class="font-bold text-slate-800 font-mono-code">${distId === 'BB' ? 'V sídle' : (getPairData(distId, 'BB') ? getPairData(distId, 'BB').time : '-')}</span>
          </div>
          <div class="pt-1.5 border-t border-slate-100/80 flex items-center justify-between flex-wrap gap-1.5">
            <span class="text-[10px] text-slate-400 font-medium">Stav simulácie:</span>
            <div class="flex items-center space-x-1.5">
              ${isSpecialWinter ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200"><i class="fa-regular fa-snowflake mr-1"></i>Zima aktívna</span>' : ''}
              ${isSpecialBusy ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200"><i class="fa-solid fa-triangle-exclamation mr-1"></i>MU simulácia</span>' : ''}
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">${availableRoutes.length} trás</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDispatchResults(distId, { decision: hudDecision, reason: hudReason }, availableRoutes);
}

function setCascadeLevel(level, showNotification = true) {
  const lvlNum = parseInt(level, 10) || 1;
  mapState.cascadeLevel = lvlNum;

  // Level configuration
  const lvlConfig = {
    1: { color: 'emerald', hex: '#059669', name: 'Lokálne sily', btnBg: 'bg-emerald-600', ring: 'ring-emerald-500/80', border: 'border-emerald-500' },
    2: { color: 'sky', hex: '#0284c7', name: 'Regionálna podpora', btnBg: 'bg-sky-600', ring: 'ring-sky-500/80', border: 'border-sky-500' },
    3: { color: 'rose', hex: '#e11d48', name: 'Celokrajská mobilizácia', btnBg: 'bg-rose-600', ring: 'ring-rose-500/80', border: 'border-rose-500' }
  };

  // Aktualizácia tlačidiel v simulátore
  [1, 2, 3].forEach(l => {
    const btn = document.getElementById(`btnCascadeLvl${l}`);
    if (btn) {
      if (l === lvlNum) {
        btn.className = `px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center ${lvlConfig[l].btnBg} text-white ring-2 ${lvlConfig[l].ring}`;
      } else {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center";
      }
    }

    // Prehľadové karty kaskády
    const card = document.getElementById(`cascadeCardLvl${l}`);
    if (card) {
      card.style.borderTop = `4px solid ${lvlConfig[l].hex}`;
      if (l === lvlNum) {
        card.className = `p-5 rounded-2xl bg-white ${lvlConfig[l].border} ring-2 ${lvlConfig[l].ring} shadow-md cursor-pointer transition relative group flex flex-col justify-between`;
      } else {
        card.className = "p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition relative group flex flex-col justify-between opacity-85 hover:opacity-100";
      }
    }
  });

  // Štítok nad mapou
  const badge = document.getElementById('mapCascadeLevelBadge');
  if (badge) {
    if (lvlNum === 1) {
      badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600"></span> 1. STUPEŇ: Lokálne sily';
    } else if (lvlNum === 2) {
      badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-300 shadow-sm";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-sky-600"></span> 2. STUPEŇ: Regionálna podpora';
    } else {
      badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-300 shadow-sm";
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-600"></span> 3. STUPEŇ: Celokrajská mobilizácia';
    }
  }

  runDispatchSimulation();
  if (showNotification && typeof showToast === 'function') {
    showToast(`Aktivovaný ${lvlNum}. stupeň kaskády: ${lvlConfig[lvlNum].name}`, "info");
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
    const pct = r.isBusy ? 0 : Math.min(100, Math.max(8, (r.minutes / 90) * 100));
    const barColor = r.isBusy
      ? '#cbd5e1'
      : (r.minutes <= 25
        ? '#10b981'
        : r.minutes <= 45
          ? '#0ea5e9'
          : r.minutes <= 75
            ? '#f59e0b'
            : '#ef4444');

    const cardBorderBg = r.isBusy
      ? 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-70'
      : (isTopPick
        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-400/50'
        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm');

    pill.className = `p-3 rounded-xl border transition flex flex-col justify-between ${cardBorderBg}`;

    let badgeExtraHtml = '';
    if (r.isBusy) {
      badgeExtraHtml += `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300"><i class="fa-solid fa-ban mr-0.5"></i>Vlastná MU (nedostupný)</span>`;
    }
    if (mapState && mapState.winterMode && r.mountainPass && !r.isBusy) {
      badgeExtraHtml += `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-300"><i class="fa-regular fa-snowflake mr-0.5"></i>+${r.winterDelay}m (${r.passName})</span>`;
    }

    pill.innerHTML = `
      <div class="flex items-start justify-between gap-2 text-xs">
        <div class="flex items-start gap-2.5 min-w-0">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${r.isBusy ? 'bg-slate-300 text-slate-600' : (isTopPick ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700')
      }">
            ${idx + 1}
          </div>

          <div class="min-w-0">
            <div class="font-bold ${r.isBusy ? 'text-slate-600' : 'text-slate-900'} truncate text-[15px] leading-tight">
              ${r.id}
            </div>

            <div class="mt-1 flex flex-col items-start gap-0.5 text-[10px] text-slate-500">
              <span class="px-1.5 py-0.5 rounded font-bold ${r.isSameRegion ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                ${r.isSameRegion ? 'Región' : 'Sused'}
              </span>
              <span class="font-medium leading-tight">${r.region}</span>
              ${badgeExtraHtml ? `<div class="flex flex-col gap-0.5 mt-0.5">${badgeExtraHtml}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0 pl-1">
          ${r.isBusy ? `
            <span class="font-extrabold font-mono-code text-rose-600 text-xs flex items-center justify-end gap-1">
              <i class="fa-solid fa-ban text-[10px]"></i> Nedostupný
            </span>
            <span class="block text-[10px] text-slate-400 font-normal">vlastná MU</span>
          ` : `
            ${(r.effectiveMinutes !== r.baseMinutes) ? `<span class="block text-[10px] text-slate-400 line-through font-mono-code">${r.baseTime}</span>` : ''}
            <span class="font-extrabold font-mono-code ${r.fast ? 'text-emerald-700' : (r.slow ? 'text-amber-700' : 'text-slate-800')} text-[15px] leading-none">
              ${r.time}
            </span>
            <span class="block text-[10px] text-slate-400 font-normal font-mono-code mt-0.5">${Math.round(r.minutes)} min</span>
          `}
        </div>
      </div>

      <div class="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
        <span class="font-medium">${r.km} km</span>
        <span class="font-medium ${r.fast ? 'text-emerald-600' : (r.slow ? 'text-amber-600' : 'text-slate-500')}">${r.fast ? 'Rýchly' : (r.slow ? 'Dlhší' : 'Stredný')}</span>
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
