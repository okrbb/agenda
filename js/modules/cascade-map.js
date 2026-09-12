/* =========================================================================
   CASCADE MAP & CONVOYS ANIMATION MODULE (HTML5 CANVAS)
   Interaktívna mapa okresov BBK, animácie dojazdov a posilových konvojov
   ========================================================================= */

const mapState = {
  selectedDistrictId: null,
  hoveredDistrictId: null,
  activeConvoys: [],
  burstParticles: [],
  wavePulse: 0,
  arrivedCount: 0,
  totalDispatched: 0,
  animationRunning: false,
  animationFrameId: null
};

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
    const neighbors = MAP_DISTRICT_DATA[distId].neighbors || [];
    neighborsList.innerHTML = neighbors.map(nId => {
      const nMeta = DISTRICT_DICT[nId];
      const nPalette = getSupportPalette(nId, distId);
      return `
        <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold" style="border-color: ${nPalette.ring}; background-color: ${nPalette.soft}; color: ${nPalette.fill}">
          <span class="w-2 h-2 rounded-full" style="background-color: ${nPalette.fill}"></span>
          ${nId} • ${nMeta.name} <span class="opacity-75 font-normal">(${nMeta.region})</span>
        </span>
      `;
    }).join('') || '<span class="text-[11px] text-slate-500 italic">Bez susedov</span>';
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
          <span class="text-[10px] text-slate-600 truncate">${MAP_DISTRICT_DATA[id].name.split(' ')[0]}</span>
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
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    mapState.burstParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

function launchCascadeConvoys(distId) {
  const target = MAP_DISTRICT_DATA[distId];
  if (!target) return;

  mapState.activeConvoys = [];
  mapState.burstParticles = [];
  mapState.arrivedCount = 0;
  mapState.totalDispatched = target.neighbors.length;
  mapState.wavePulse = 0;

  target.neighbors.forEach((neighborId, index) => {
    setTimeout(() => {
      if (mapState.selectedDistrictId !== distId) return;

      const neighbor = MAP_DISTRICT_DATA[neighborId];
      const palette = getSupportPalette(neighborId, distId);
      mapState.activeConvoys.push({
        fromId: neighborId,
        toId: distId,
        progress: 0,
        speed: (0.0045 + Math.random() * 0.0023),
        color: palette.fill,
        unitName: `${neighbor.name} → ${target.name}`
      });

      addMapLogEntry(`➡️ ${neighbor.name} odoslala posilu do ${target.name}.`, 'cyan');
    }, index * 260);
  });
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

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const activeId = mapState.selectedDistrictId;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const selectedNeighbors = activeId ? (MAP_DISTRICT_DATA[activeId]?.neighbors || []) : [];
  const drawnEdges = new Set();

  Object.keys(MAP_DISTRICT_DATA).forEach(fromId => {
    const from = MAP_DISTRICT_DATA[fromId];
    const fromCoord = getMapCoordinates(fromId);

    (from.neighbors || []).forEach(toId => {
      const edgeKey = [fromId, toId].sort().join('--');
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);

      const toCoord = getMapCoordinates(toId);
      ctx.beginPath();
      ctx.moveTo(fromCoord.x, fromCoord.y);
      ctx.lineTo(toCoord.x, toCoord.y);

      const isActive = activeId && (fromId === activeId || toId === activeId);
      const supportingDistId = (fromId === activeId) ? toId : fromId;
      const edgePalette = isActive ? getSupportPalette(supportingDistId, activeId) : null;
      ctx.strokeStyle = isActive && edgePalette ? edgePalette.fill : 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = isActive ? 3 : 1.4;
      ctx.shadowColor = (isActive && edgePalette) ? edgePalette.glow : 'transparent';
      ctx.shadowBlur = isActive ? 12 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  });

  for (let i = mapState.activeConvoys.length - 1; i >= 0; i--) {
    const convoy = mapState.activeConvoys[i];
    convoy.progress += convoy.speed;

    const start = getMapCoordinates(convoy.fromId);
    const end = getMapCoordinates(convoy.toId);
    const curX = start.x + (end.x - start.x) * convoy.progress;
    const curY = start.y + (end.y - start.y) * convoy.progress;

    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = convoy.color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(curX, curY, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = convoy.color;
    ctx.fill();

    const trailLen = 0.18;
    const trailStartProgress = Math.max(0, convoy.progress - trailLen);
    const trailStartX = start.x + (end.x - start.x) * trailStartProgress;
    const trailStartY = start.y + (end.y - start.y) * trailStartProgress;

    const gradient = ctx.createLinearGradient(curX, curY, trailStartX, trailStartY);
    gradient.addColorStop(0, convoy.color);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(trailStartX, trailStartY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (convoy.progress >= 1) {
      mapState.activeConvoys.splice(i, 1);
      mapState.arrivedCount += 1;
      triggerCascadeBurst(end.x, end.y, convoy.color);
      addMapLogEntry(`🚒 Dorazila pomoc z ${convoy.fromId} do ${convoy.toId}.`, 'emerald');
    }
  }

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

  mapState.wavePulse += 0.04;

  Object.keys(MAP_DISTRICT_DATA).forEach(id => {
    const data = MAP_DISTRICT_DATA[id];
    const coord = getMapCoordinates(id);
    const isSelected = id === activeId;
    const isNeighbor = selectedNeighbors.includes(id);
    const isHovered = id === mapState.hoveredDistrictId;
    const radius = getCascadeMapRadius(id, isSelected, isNeighbor);
    const supportPalette = isNeighbor ? getSupportPalette(id, activeId) : null;

    if (isSelected) {
      const wave1 = (mapState.wavePulse % 2);
      const wave2 = ((mapState.wavePulse + 1) % 2);

      [wave1, wave2].forEach((wave) => {
        const pulseR = radius + wave * 40;
        const pulseAlpha = Math.max(0, 1 - (wave / 2) * 1.1);
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${pulseAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
    }

    if (isNeighbor) {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = supportPalette ? supportPalette.soft : 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.save();
    if (isSelected) {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 24;
    } else if (isNeighbor) {
      ctx.shadowColor = supportPalette ? supportPalette.glow : '#22d3ee';
      ctx.shadowBlur = 16;
    } else if (isHovered) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
    }

    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#e11d48' : isNeighbor ? (supportPalette?.fill || '#0891b2') : '#1e293b';
    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : isNeighbor ? 2.5 : 2;
    ctx.strokeStyle = isSelected ? '#ffe4e6' : isNeighbor ? (supportPalette?.ring || '#67e8f9') : '#475569';
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.22)' : (isNeighbor ? (supportPalette?.soft || 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.12)');
    ctx.fill();

    ctx.fillStyle = isSelected ? '#fecdd3' : isNeighbor ? (supportPalette?.text || '#a5f3fc') : '#94a3b8';
    ctx.font = `700 11px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id, coord.x, coord.y + 1);

    ctx.fillStyle = isSelected ? '#fbbf24' : isNeighbor ? (supportPalette?.fill || '#38bdf8') : '#cbd5e1';
    ctx.font = '12px sans-serif';
    ctx.fillText(isSelected ? '⚠️' : isNeighbor ? '🛡️' : '', coord.x + radius - 5, coord.y - radius + 5);
  });

  const northX = width - 62;
  const northY = 28;
  ctx.fillStyle = 'rgba(71, 85, 105, 0.6)';
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
