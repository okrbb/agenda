/* =========================================================================
   CASCADE MAP & CONVOYS ANIMATION MODULE (HTML5 CANVAS) - 2026 SPATIAL ENGINE
   Interaktívna mapa okresov BBK, zakrivené Bézierove trajektórie a konvoje
   ========================================================================= */

const mapState = {
  selectedDistrictId: null,
  hoveredDistrictId: null,
  cascadeLevel: 1, // 1: Lokálny, 2: Regionálny, 3: Celokrajský
  activeConvoys: [],
  burstParticles: [],
  shockwaves: [],
  wavePulse: 0,
  arrivedCount: 0,
  totalDispatched: 0,
  animationRunning: false,
  animationFrameId: null
};

/**
 * Výpočet riadiaceho bodu (Bézier Control Point) pre zakrivenú trajektóriu.
 */
function getCurveControlPoint(start, end, curveFactor = 18) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  return {
    x: midX - (dy / dist) * curveFactor,
    y: midY + (dx / dist) * curveFactor
  };
}

/**
 * Výpočet bodu na kvadratickej Bézierovej krivke pre daný pokrok t [0..1].
 */
function getBezierPoint(start, cp, end, t) {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * cp.x + t * t * end.x,
    y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * cp.y + t * t * end.y
  };
}

function syncCascadeMapSelection(distId) {
  if (!distId || !MAP_DISTRICT_DATA[distId]) return;

  const targetMeta = DISTRICT_DICT[distId];
  if (!targetMeta) return;

  const selectedName = document.getElementById('mapSelectedDistrictName');
  const selectedMeta = document.getElementById('mapSelectedDistrictMeta');
  const selectedBadge = document.getElementById('mapSelectedDistrictBadge');
  const neighborsList = document.getElementById('mapNeighborsList');
  const mapGrid = document.getElementById('mapDistrictGrid');

  if (selectedName) {
    selectedName.textContent = `${targetMeta.name} (${distId})`;
  }

  if (selectedMeta) {
    selectedMeta.innerHTML = `
      <div class="flex justify-between"><span class="text-slate-500">Región:</span><span class="font-bold text-slate-800">${targetMeta.region}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Kapacita:</span><span class="font-bold text-slate-800">${targetMeta.fte} FTE</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Dojazd z BB:</span><span class="font-bold text-slate-800">${distId === 'BB' ? '0 min (v sídle)' : (getPairData(distId, 'BB') ? getPairData(distId, 'BB').time + ' (' + getPairData(distId, 'BB').km + ' km)' : '-')}</span></div>
    `;
  }

  if (selectedBadge) {
    selectedBadge.textContent = distId;
  }

  if (neighborsList) {
    const curLevel = mapState.cascadeLevel || 2;
    if (curLevel === 1) {
      const regionalDistricts = Object.keys(DISTRICT_DICT).filter(id => id !== distId && DISTRICT_DICT[id].regionId === targetMeta.regionId);
      if (regionalDistricts.length === 0) {
        neighborsList.innerHTML = '<span class="text-[11px] text-slate-500 italic">Iba vlastné sily (žiadne ďalšie pracovisko v regióne)</span>';
      } else {
        neighborsList.innerHTML = regionalDistricts.map(nId => {
          const nMeta = DISTRICT_DICT[nId];
          return `
            <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ${nId} • ${nMeta.name} <span class="opacity-75 font-normal">(v pohotovosti)</span>
            </span>
          `;
        }).join('');
      }
    } else if (curLevel === 2) {
      const neighbors = MAP_DISTRICT_DATA[distId].neighbors || [];
      neighborsList.innerHTML = neighbors.map(nId => {
        const nMeta = DISTRICT_DICT[nId];
        const nPalette = getSupportPalette(nId, distId);
        return `
          <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm" style="border-color: ${nPalette.ring}; background-color: ${nPalette.soft}; color: ${nPalette.fill}">
            <span class="w-2 h-2 rounded-full" style="background-color: ${nPalette.fill}"></span>
            ${nId} • ${nMeta.name} <span class="opacity-75 font-normal">(${nMeta.region})</span>
          </span>
        `;
      }).join('') || '<span class="text-[11px] text-slate-500 italic">Bez susedov</span>';
    } else {
      neighborsList.innerHTML = `
        <span class="inline-flex items-center gap-1.5 rounded-full border border-purple-300 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-900 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
          Celokrajská mobilizácia všetkých 13 okresov BBK • Krajský štáb Banská Bystrica
        </span>
      `;
    }
  }

  if (mapGrid) {
    const buttons = Array.from(mapGrid.querySelectorAll('.district-map-btn'));
    buttons.forEach(btn => {
      const isActive = btn.dataset.id === distId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  if (typeof renderCascadeMap === 'function') {
    renderCascadeMap();
  }
}

function renderDistrictMapButtons() {
  const grid = document.getElementById('mapDistrictGrid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.keys(MAP_DISTRICT_DATA).forEach(id => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'district-map-btn';
    btn.dataset.id = id;
    btn.setAttribute('aria-label', `Vybrať okres ${MAP_DISTRICT_DATA[id].name}`);
    btn.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="font-mono-code text-[11px] font-extrabold text-sky-700">${id}</span>
          <span class="text-[10px] text-slate-700 truncate font-medium">${MAP_DISTRICT_DATA[id].name.split(' ')[0]}</span>
        </div>
        <span class="rounded bg-slate-100 text-[9px] font-semibold px-1 py-0.5 text-slate-500">${Math.round(MAP_DISTRICT_DATA[id].area)} km²</span>
      </div>
    `;
    btn.addEventListener('click', () => {
      const select = document.getElementById('dispatchDistrictSelect');
      if (select) {
        select.value = id;
      }
      runDispatchSimulation();
    });
    grid.appendChild(btn);
  });
}

function triggerCascadeBurst(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    mapState.burstParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      color,
      size: 2 + Math.random() * 3.2
    });
  }
}

/**
 * Vyhľadanie najrýchlejšej trasy po cestnej sieti (Dijkstrov algoritmus vážený dojazdovým časom).
 */
function findRoadPath(startId, endId) {
  if (startId === endId) return [startId];

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(MAP_DISTRICT_DATA));

  Object.keys(MAP_DISTRICT_DATA).forEach(id => {
    distances[id] = Infinity;
  });
  distances[startId] = 0;

  while (unvisited.size > 0) {
    let curr = null;
    let minDistance = Infinity;
    unvisited.forEach(node => {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        curr = node;
      }
    });

    if (curr === null || minDistance === Infinity) break;
    if (curr === endId) break;

    unvisited.delete(curr);

    const neighbors = MAP_DISTRICT_DATA[curr]?.neighbors || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const pair = (typeof getPairData === 'function') ? getPairData(curr, neighbor) : null;
      const weight = pair ? ((typeof parseTimeToMinutes === 'function') ? parseTimeToMinutes(pair.time) : pair.km) : 45;

      const alt = distances[curr] + weight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = curr;
      }
    }
  }

  const path = [];
  let u = endId;
  if (!previous[u] && u !== startId) {
    return [startId, endId];
  }

  while (u) {
    path.unshift(u);
    u = previous[u];
  }
  return path;
}

function launchCascadeConvoys(distId) {
  const target = MAP_DISTRICT_DATA[distId];
  if (!target) return;
  const targetMeta = DISTRICT_DICT[distId];

  mapState.activeConvoys = [];
  mapState.burstParticles = [];
  mapState.shockwaves = [];
  mapState.arrivedCount = 0;
  mapState.wavePulse = 0;

  const level = mapState.cascadeLevel || 1;

  // 1. STUPEŇ: Lokálne sily (vlastný okres na mieste, región v pohotovosti bez vysielania posíl)
  if (level === 1) {
    mapState.totalDispatched = 0;
    mapState.activeConvoys = [];
    const regionalDistricts = Object.keys(DISTRICT_DICT).filter(id => id !== distId && DISTRICT_DICT[id].regionId === targetMeta.regionId);
    const regionalNames = regionalDistricts.map(id => DISTRICT_DICT[id].name).join(', ');
    addMapLogEntry(`🟢 1. STUPEŇ KASKÁDY: Udalosť v okrese ${target.name} rieši výhradne vlastné pracovisko (${targetMeta?.fte || 2} FTE).`, 'emerald');
    if (regionalDistricts.length > 0) {
      addMapLogEntry(`⏳ Partnerské pracoviská regiónu ${targetMeta.region} (${regionalNames}) sú pripravené pomôcť v pohotovosti (zatiaľ nevysielajú posily).`, 'neutral');
    }
    return;
  }

  // 2. STUPEŇ: Regionálna podpora (susedské okresy do ~45 min po cestnej sieti)
  if (level === 2) {
    const neighbors = target.neighbors || [];
    mapState.totalDispatched = neighbors.length;

    addMapLogEntry(`🔷 2. STUPEŇ KASKÁDY: Aktivovaná regionálna podpora a pravidlo dojazdov pre okres ${target.name}.`, 'cyan');

    neighbors.forEach((neighborId, index) => {
      setTimeout(() => {
        if (mapState.selectedDistrictId !== distId || mapState.cascadeLevel !== 2) return;

        const neighbor = MAP_DISTRICT_DATA[neighborId];
        const palette = getSupportPalette(neighborId, distId);
        mapState.activeConvoys.push({
          fromId: neighborId,
          toId: distId,
          path: [neighborId, distId],
          segmentIndex: 0,
          progress: 0,
          speed: (0.006 + Math.random() * 0.002),
          color: palette.fill,
          unitName: `${neighbor.name} → ${target.name}`
        });

        addMapLogEntry(`➡️ ${neighbor.name} odoslala posilu do ${target.name}.`, 'cyan');
      }, index * 260);
    });
    return;
  }

  // 3. STUPEŇ: Celokrajská mobilizácia (všetky okresy kraja zbiehajúce sa po cestných trasách)
  if (level === 3) {
    const allOtherIds = Object.keys(DISTRICT_DICT).filter(id => id !== distId);
    
    // Zoradenie podľa dojazdu
    const sorted = allOtherIds.map(id => {
      const pair = getPairData(distId, id);
      const minutes = pair ? parseTimeToMinutes(pair.time) : 999;
      return { id, minutes, km: pair ? pair.km : 0 };
    }).sort((a, b) => a.minutes - b.minutes);

    mapState.totalDispatched = sorted.length;

    addMapLogEntry(`🚨 3. STUPEŇ KASKÁDY: Celokrajská mobilizácia pre okres ${target.name}!`, 'rose');
    addMapLogEntry(`🏛️ Krajský štáb BB a okresné pracoviská vyrážajú po cestných koridoroch kraja.`, 'rose');

    sorted.forEach((item, index) => {
      const otherId = item.id;
      const otherDist = MAP_DISTRICT_DATA[otherId];
      const isHQ = (otherId === 'BB');
      
      let wave = 1;
      let waveColor = '#0ea5e9'; // Cyan/modrá pre I. vlnu
      let waveDelay = index * 160;

      if (isHQ) {
        wave = 2;
        waveColor = '#7c3aed'; // Fialová pre krajské sídlo
        waveDelay = 220;
      } else if (item.minutes <= 45) {
        wave = 1;
        waveColor = '#0284c7';
        waveDelay = index * 160;
      } else if (item.minutes <= 75) {
        wave = 2;
        waveColor = '#f59e0b';
        waveDelay = 450 + index * 180;
      } else {
        wave = 3;
        waveColor = '#e11d48';
        waveDelay = 900 + index * 200;
      }

      setTimeout(() => {
        if (mapState.selectedDistrictId !== distId || mapState.cascadeLevel !== 3) return;

        const roadPath = findRoadPath(otherId, distId);

        mapState.activeConvoys.push({
          fromId: otherId,
          toId: distId,
          path: roadPath,
          segmentIndex: 0,
          progress: 0,
          speed: (0.008 + Math.random() * 0.0025),
          color: waveColor,
          wave: wave,
          isHQ: isHQ,
          unitName: `${isHQ ? '🏛️ Krajský štáb BB' : otherDist.name} → ${target.name}`
        });

        if (isHQ) {
          addMapLogEntry(`⭐ VÝJAZD KRAJSKÉHO ŠTÁBU: Banská Bystrica vysiela špecialistov po cestnej trase do ${target.name}.`, 'rose');
        } else if (wave === 1 && index === 0) {
          addMapLogEntry(`⚡ I. VLNA (do 45 min): Výjazd ${otherDist.name} po trase ${roadPath.join(' → ')}.`, 'cyan');
        } else if (wave === 2 && index === 3) {
          addMapLogEntry(`🚚 II. VLNA (45–75 min): Posily z ďalších regiónov na cestnej trase.`, 'amber');
        } else if (wave === 3 && index === 7) {
          addMapLogEntry(`🛡️ III. VLNA (vzdialené zálohy): Konvoje na diaľkových cestných ťahoch.`, 'rose');
        }
      }, waveDelay);
    });
  }
}

function startCascadeMapAnimation() {
  if (mapState.animationRunning) return;

  const tick = () => {
    if (document.getElementById('districtMapCanvas')) {
      renderCascadeMap();
    }
    mapState.animationFrameId = requestAnimationFrame(tick);
  };

  mapState.animationRunning = true;
  mapState.animationFrameId = requestAnimationFrame(tick);
}

function renderCascadeMap() {
  const canvas = document.getElementById('districtMapCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const activeId = mapState.selectedDistrictId;

  ctx.clearRect(0, 0, width, height);

  // 1. Svetlé pozadie s jemnou taktickou mriežkou
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
  ctx.lineWidth = 1;
  const step = 28;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const selectedNeighbors = activeId ? (MAP_DISTRICT_DATA[activeId]?.neighbors || []) : [];
  const targetMeta = activeId ? DISTRICT_DICT[activeId] : null;
  const drawnEdges = new Set();
  const curLevel = mapState.cascadeLevel || 1;

  // Zistenie aktívnych cestných segmentov, po ktorých aktuálne prechádzajú konvoje
  const activeRoadSegments = new Map();
  mapState.activeConvoys.forEach(c => {
    const path = c.path || [c.fromId, c.toId];
    const segIdx = c.segmentIndex || 0;
    if (segIdx < path.length - 1) {
      const segFrom = path[segIdx];
      const segTo = path[segIdx + 1];
      const segKey = [segFrom, segTo].sort().join('--');
      if (!activeRoadSegments.has(segKey)) {
        activeRoadSegments.set(segKey, c.color);
      }
    }
  });

  // 2. Vykreslenie zakrivených geodetických spojníc (Bézierove oblúky predstavujúce cestnú sieť)
  Object.keys(MAP_DISTRICT_DATA).forEach(fromId => {
    const from = MAP_DISTRICT_DATA[fromId];

    (from.neighbors || []).forEach(toId => {
      const [idA, idB] = [fromId, toId].sort();
      const edgeKey = `${idA}--${idB}`;
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);

      const coordA = getMapCoordinates(idA);
      const coordB = getMapCoordinates(idB);
      const cp = getCurveControlPoint(coordA, coordB, 18);

      const isConnectedToActive = activeId && (fromId === activeId || toId === activeId);
      const supportingDistId = (fromId === activeId) ? toId : fromId;
      const suppMeta = DISTRICT_DICT[supportingDistId];
      const isSameRegion = targetMeta && suppMeta && (suppMeta.regionId === targetMeta.regionId);
      const edgePalette = isConnectedToActive ? getSupportPalette(supportingDistId, activeId) : null;

      ctx.beginPath();
      ctx.moveTo(coordA.x, coordA.y);
      ctx.quadraticCurveTo(cp.x, cp.y, coordB.x, coordB.y);

      if (curLevel === 1) {
        // V 1. stupni: iba spojnice v rámci vlastného regiónu sú jemne zvýraznené ako linky pohotovosti
        if (isConnectedToActive && isSameRegion) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 4]);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }
      } else if (curLevel === 2) {
        // V 2. stupni: susedské spojnice (aj cez hranicu regiónu) sú aktívne
        if (isConnectedToActive && edgePalette) {
          ctx.strokeStyle = edgePalette.fill;
          ctx.lineWidth = 2.8;
          ctx.shadowColor = edgePalette.glow || edgePalette.fill;
          ctx.shadowBlur = 10;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
          ctx.lineWidth = 1.3;
          ctx.shadowBlur = 0;
          ctx.setLineDash([]);
        }
      } else {
        // V 3. stupni: osvetlenie reálnych ciest, po ktorých aktuálne prechádzajú konvoje
        if (activeRoadSegments.has(edgeKey)) {
          const segColor = activeRoadSegments.get(edgeKey);
          ctx.strokeStyle = segColor;
          ctx.lineWidth = 3.0;
          ctx.shadowColor = segColor;
          ctx.shadowBlur = 10;
          ctx.setLineDash([]);
        } else if (isConnectedToActive && edgePalette) {
          ctx.strokeStyle = edgePalette.fill;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = edgePalette.glow || edgePalette.fill;
          ctx.shadowBlur = 6;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1.1;
          ctx.shadowBlur = 0;
          ctx.setLineDash([]);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
    });
  });

  // V 1. stupni: vykreslenie priamej spojnice pohotovosti pre všetky okresy v rovnakom regióne
  if (curLevel === 1 && activeId && targetMeta) {
    Object.keys(DISTRICT_DICT).forEach(otherId => {
      if (otherId === activeId) return;
      if (DISTRICT_DICT[otherId].regionId !== targetMeta.regionId) return;
      const [idA, idB] = [activeId, otherId].sort();
      const edgeKey = `${idA}--${idB}`;
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);

      const coordA = getMapCoordinates(idA);
      const coordB = getMapCoordinates(idB);
      const cp = getCurveControlPoint(coordA, coordB, 18);

      ctx.beginPath();
      ctx.moveTo(coordA.x, coordA.y);
      ctx.quadraticCurveTo(cp.x, cp.y, coordB.x, coordB.y);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // 3. Pohyb konvojov pozdĺž reálnej cestnej siete so svetelným chvostom
  for (let i = mapState.activeConvoys.length - 1; i >= 0; i--) {
    const convoy = mapState.activeConvoys[i];
    const path = convoy.path || [convoy.fromId, convoy.toId];
    const segIdx = convoy.segmentIndex || 0;

    if (segIdx >= path.length - 1) {
      mapState.activeConvoys.splice(i, 1);
      continue;
    }

    convoy.progress += convoy.speed;

    const currFromId = path[segIdx];
    const currToId = path[segIdx + 1];

    const start = getMapCoordinates(currFromId);
    const end = getMapCoordinates(currToId);

    // Kľúčové: Konvoj nasleduje presne ten istý Bézierov oblúk cesty medzi currFromId a currToId
    const [idA, idB] = [currFromId, currToId].sort();
    const coordA = getMapCoordinates(idA);
    const coordB = getMapCoordinates(idB);
    const cp = getCurveControlPoint(coordA, coordB, 18);

    const curPos = getBezierPoint(start, cp, end, convoy.progress);

    // Svetelný chvost (trail) pozdĺž krivky cesty
    const trailSteps = 5;
    for (let s = 1; s <= trailSteps; s++) {
      const trailT = Math.max(0, convoy.progress - s * 0.035);
      const trailPos = getBezierPoint(start, cp, end, trailT);
      const trailAlpha = (1 - s / trailSteps) * 0.5;

      ctx.beginPath();
      ctx.arc(trailPos.x, trailPos.y, 4.5 * (1 - s / trailSteps * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = convoy.color;
      ctx.globalAlpha = trailAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Taktická svietiaca hlavica konvoja
    ctx.beginPath();
    ctx.arc(curPos.x, curPos.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = convoy.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(curPos.x, curPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = convoy.color;
    ctx.fill();

    // Ak konvoj dosiahol koniec aktuálneho segmentu cesty
    if (convoy.progress >= 1) {
      if (segIdx + 1 < path.length - 1) {
        // Pokračovanie po ceste cez medzilahnutý okres
        convoy.segmentIndex = segIdx + 1;
        convoy.progress = 0;
      } else {
        // Finálne dorazenie do cieľa celej trasy
        mapState.activeConvoys.splice(i, 1);
        mapState.arrivedCount += 1;
        const finalCoord = getMapCoordinates(convoy.toId);
        triggerCascadeBurst(finalCoord.x, finalCoord.y, convoy.color);

        mapState.shockwaves.push({
          x: finalCoord.x,
          y: finalCoord.y,
          radius: 6,
          maxRadius: 42,
          alpha: 0.9,
          color: convoy.color
        });

        addMapLogEntry(`🚒 ${convoy.unitName} dorazila na miesto zásahu.`, 'emerald');
      }
    }
  }

  // 4. Vykreslenie dynamických šokových prstencov (shockwaves)
  for (let s = mapState.shockwaves.length - 1; s >= 0; s--) {
    const sw = mapState.shockwaves[s];
    sw.radius += 1.8;
    sw.alpha -= 0.038;

    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      mapState.shockwaves.splice(s, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = sw.alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 5. Vykreslenie časticového systému (burst particles)
  for (let i = mapState.burstParticles.length - 1; i >= 0; i--) {
    const particle = mapState.burstParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= particle.decay;

    if (particle.life <= 0) {
      mapState.burstParticles.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  mapState.wavePulse += 0.035;

  // 6. Vykreslenie uzlov okresov (Radar Ripple, svetelné fotónové orámovanie)
  Object.keys(MAP_DISTRICT_DATA).forEach(id => {
    const coord = getMapCoordinates(id);
    const isSelected = (id === activeId);
    const nodeMeta = DISTRICT_DICT[id];
    const isSameRegion = targetMeta && nodeMeta && (nodeMeta.regionId === targetMeta.regionId);
    const isHovered = (id === mapState.hoveredDistrictId);

    // Stupne kaskády
    const curLevel = mapState.cascadeLevel || 2;
    const isLevel1 = (curLevel === 1);
    const isLevel2 = (curLevel === 2);
    const isLevel3 = (curLevel === 3);

    // 1. stupeň: iba okresy z vlastného regiónu sú v pohotovosti (isRegionalStandby); okresy z iných regiónov nie sú zvýraznené
    const isRegionalStandby = isLevel1 && !isSelected && isSameRegion;
    // 2. stupeň: susedia (aj medziregionálni) sú aktívni (isNeighborActive)
    const isNeighborActive = isLevel2 && !isSelected && selectedNeighbors.includes(id);

    const radius = isSelected ? 18 : (isRegionalStandby || isNeighborActive ? 14 : 12);
    const supportPalette = isNeighborActive ? getSupportPalette(id, activeId) : null;

    // Pulzujúci radarový sken pre vybraný okres
    if (isSelected) {
      const waveCount = 3;
      const pulseColor = isLevel1 ? '16, 185, 129' : '225, 29, 72';
      for (let w = 0; w < waveCount; w++) {
        const waveProgress = ((mapState.wavePulse * 0.45 + w / waveCount) % 1);
        const pulseR = radius + waveProgress * 44;
        const pulseAlpha = (1 - waveProgress) * 0.75;

        ctx.beginPath();
        ctx.arc(coord.x, coord.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${pulseColor}, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Fotónový svetelný kruh: pre susedov v 2. stupni alebo jemný standby kruh pre vlastný región v 1. stupni
    if (isNeighborActive && supportPalette) {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = supportPalette.soft || 'rgba(8, 145, 178, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (isRegionalStandby) {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.save();
    if (isSelected) {
      ctx.shadowColor = isLevel1 ? '#10b981' : '#e11d48';
      ctx.shadowBlur = 20;
    } else if (isNeighborActive && supportPalette) {
      ctx.shadowColor = supportPalette.glow || '#0284c7';
      ctx.shadowBlur = 14;
    } else if (isRegionalStandby) {
      ctx.shadowColor = 'rgba(16, 185, 129, 0.45)';
      ctx.shadowBlur = 10;
    } else if (isHovered) {
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;
    }

    // Telo uzla
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
    if (isSelected) {
      ctx.fillStyle = isLevel1 ? '#059669' : '#e11d48';
    } else if (isRegionalStandby) {
      ctx.fillStyle = '#ecfdf5'; // mentolovo biela pre standby v regióne
    } else if (isNeighborActive && supportPalette) {
      ctx.fillStyle = supportPalette.fill || '#0284c7';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fill();

    ctx.lineWidth = isSelected ? 3.5 : (isRegionalStandby ? 2.5 : (isNeighborActive ? 3 : 2));
    if (isSelected) {
      ctx.strokeStyle = isLevel1 ? '#a7f3d0' : '#ffe4e6';
    } else if (isRegionalStandby) {
      ctx.strokeStyle = '#10b981';
    } else if (isNeighborActive && supportPalette) {
      ctx.strokeStyle = supportPalette.ring || '#38bdf8';
    } else {
      ctx.strokeStyle = isHovered ? '#0284c7' : '#cbd5e1';
    }
    ctx.stroke();
    ctx.restore();

    // Vnútorný štítok
    if (isSelected) {
      ctx.fillStyle = '#ffffff';
    } else if (isRegionalStandby) {
      ctx.fillStyle = '#065f46';
    } else if (isNeighborActive) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = isHovered ? '#0f172a' : '#475569';
    }
    ctx.font = `700 11px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id, coord.x, coord.y + 0.5);

    // Stavový piktogram (majáčik / štít / krajský štáb / pohotovosť)
    if (isSelected) {
      ctx.font = '12px sans-serif';
      ctx.fillText(isLevel1 ? '🟢' : '🚨', coord.x + radius - 4, coord.y - radius + 4);
    } else if (id === 'BB' && isLevel3) {
      ctx.font = '12px sans-serif';
      ctx.fillText('🏛️', coord.x + radius - 4, coord.y - radius + 4);
    } else if (isNeighborActive) {
      ctx.font = '11px sans-serif';
      ctx.fillText('🛡️', coord.x + radius - 4, coord.y - radius + 4);
    } else if (isRegionalStandby) {
      ctx.font = '10px sans-serif';
      ctx.fillText('⏳', coord.x + radius - 4, coord.y - radius + 4);
    }
  });

  // Taktická smerová ružica (Sever)
  const northX = width - 48;
  const northY = 32;
  ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
  ctx.font = '700 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▲ S', northX, northY);
}

function handleCascadeMapClick(event) {
  const clickedId = getMapDistrictAtPos(event.clientX, event.clientY);
  if (!clickedId) return;

  const select = document.getElementById('dispatchDistrictSelect');
  if (select) {
    select.value = clickedId;
  }
  runDispatchSimulation();
}

function initCascadeMap() {
  renderDistrictMapButtons();
  renderCascadeMap();
  startCascadeMapAnimation();

  const canvas = document.getElementById('districtMapCanvas');
  const resetBtn = document.getElementById('resetMapSelectionBtn');
  if (canvas) {
    canvas.style.cursor = 'crosshair';
    canvas.addEventListener('mousemove', (event) => {
      const hoveredId = getMapDistrictAtPos(event.clientX, event.clientY);
      mapState.hoveredDistrictId = hoveredId;
      canvas.style.cursor = hoveredId ? 'pointer' : 'crosshair';
    });
    canvas.addEventListener('mouseleave', () => {
      mapState.hoveredDistrictId = null;
      canvas.style.cursor = 'crosshair';
    });
    canvas.addEventListener('click', handleCascadeMapClick);
    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const clickedId = getMapDistrictAtPos(touch.clientX, touch.clientY);
        if (clickedId) {
          const select = document.getElementById('dispatchDistrictSelect');
          if (select) select.value = clickedId;
          runDispatchSimulation();
        }
      }
    }, { passive: true });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetDispatchSelection();
    });
  }

  const clearLogsBtn = document.getElementById('clearMapLogsBtn');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      const logs = document.getElementById('mapMissionLogs');
      if (logs) {
        logs.innerHTML = '<div class="text-[11px] text-slate-500 italic">Denník bol vymazaný.</div>';
      }
    });
  }

  addMapLogEntry('Mapa pripravená. Kliknutím na okres sa aktivuje výpočet posilového pracoviska.', 'cyan');
}
