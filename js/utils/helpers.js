/* =========================================================================
   HELPER FUNCTIONS & UTILITIES
   Zdieľané funkcie pre výpočty, transformáciu farieb a prácu s dátami
   ========================================================================= */

/**
 * Prevod hexadecimálnej farby (#RRGGBB) na formát rgba(...) s nastavenou priehľadnosťou.
 */
function hexToRgba(hex, alpha = 0.52) {
  if (!hex) return `rgba(56, 189, 248, ${alpha})`;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Prevod reťazca času "H:MM:SS" alebo "H:MM" na celkový počet minút (float).
 */
function parseTimeToMinutes(tStr) {
  if (!tStr) return 9999;
  const parts = tStr.split(':').map(Number);
  return (parts[0] * 60) + parts[1] + (parts[2] ? parts[2] / 60 : 0);
}

/**
 * Nájdenie okresu v štruktúre REGIONS vrátane priradených metadát.
 */
function getDistrict(id) {
  for (const r of REGIONS) {
    const found = r.districts.find(d => d.id === id);
    if (found) return { ...found, regionName: r.name, regionShort: r.shortName };
  }
  return null;
}

/**
 * Nájdenie agendy podľa jej ID (napr. "AG1").
 */
function getAgenda(id) {
  return AGENDAS.find(a => a.id === id);
}

/**
 * Vyhľadanie záznamu o vzdialenosti a čase medzi dvoma okresmi.
 */
function getPairData(d1, d2) {
  if (d1 === d2) return null;
  let pair = null;
  if (RAW_TRAVEL_MATRIX[d1] && RAW_TRAVEL_MATRIX[d1][d2]) {
    pair = RAW_TRAVEL_MATRIX[d1][d2];
  } else if (RAW_TRAVEL_MATRIX[d2] && RAW_TRAVEL_MATRIX[d2][d1]) {
    pair = RAW_TRAVEL_MATRIX[d2][d1];
  }
  if (!pair) return null;

  const minutes = parseTimeToMinutes(pair.time);
  return {
    ...pair,
    fast: minutes <= 45,
    slow: minutes > 90,
    minutes: minutes
  };
}

/**
 * Paleta farieb regiónu pre vizualizácie a mapu.
 */
function getRegionPalette(regionId) {
  const region = REGIONS.find(r => r.id === regionId);
  const fallback = '#38bdf8';
  if (!region) return {
    fill: fallback,
    glow: fallback,
    ring: '#7dd3fc',
    soft: 'rgba(56, 189, 248, 0.22)',
    text: '#dbeafe'
  };

  return {
    fill: region.color,
    glow: region.color,
    ring: hexToRgba(region.color, 0.78),
    soft: hexToRgba(region.color, 0.24),
    text: '#f8fafc'
  };
}

/**
 * Určenie farby a štýlu posilového okresu vo vzťahu k vybranému cieľovému okresu.
 */
function getSupportPalette(distId, activeId) {
  if (!activeId) {
    return {
      fill: '#1e3a8a',
      glow: '#3b82f6',
      ring: '#2563eb',
      soft: 'rgba(30, 58, 138, 0.15)',
      text: '#1e293b'
    };
  }

  const activeRegionId = DISTRICT_DICT[activeId]?.regionId;
  const districtRegionId = DISTRICT_DICT[distId]?.regionId;

  if (!activeRegionId || !districtRegionId) {
    return {
      fill: '#1e3a8a',
      glow: '#3b82f6',
      ring: '#2563eb',
      soft: 'rgba(30, 58, 138, 0.15)',
      text: '#1e293b'
    };
  }

  // Ak pomoc prichádza z rovnakého regiónu -> inštitucionálna modrá
  if (districtRegionId === activeRegionId) {
    return {
      fill: '#1e3a8a',
      glow: '#3b82f6',
      ring: '#2563eb',
      soft: 'rgba(30, 58, 138, 0.15)',
      text: '#1e293b'
    };
  }

  // Ak pomoc prichádza z iného regiónu -> jantárovo-bronzová (výnimka z regionality)
  return {
    fill: '#b45309',
    glow: '#d97706',
    ring: '#d97706',
    soft: 'rgba(180, 83, 9, 0.15)',
    text: '#78350f'
  };
}

/**
 * Výpočet polomeru bodu okresu na Canvas mape podľa rozlohy a stavu vybratia.
 */
function getCascadeMapRadius(id, isSelected = false, isNeighbor = false) {
  const data = MAP_DISTRICT_DATA[id];
  if (!data) return 18;
  const minArea = 292.3;
  const maxArea = 1471.1;
  const ratio = (Math.sqrt(data.area) - Math.sqrt(minArea)) / (Math.sqrt(maxArea) - Math.sqrt(minArea));
  const base = 18 + ratio * 18;

  if (isSelected) return base + 7;
  if (isNeighbor) return base + 2;
  return base;
}

/**
 * Prepočet relatívnych súradníc okresu na aktuálne rozmery Canvasu.
 */
function getMapCoordinates(id) {
  const data = MAP_DISTRICT_DATA[id];
  if (!data) return { x: 0, y: 0 };
  const pad = 32;
  const width = document.getElementById('districtMapCanvas')?.clientWidth || 640;
  const height = document.getElementById('districtMapCanvas')?.clientHeight || 360;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  return {
    x: pad + (data.x / 1000) * usableW,
    y: pad + (data.y / 700) * usableH
  };
}

/**
 * Zistenie, na ktorý okres používateľ klikol / umiestnil kurzor na mape.
 */
function getMapDistrictAtPos(clientX, clientY) {
  const canvas = document.getElementById('districtMapCanvas');
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let closestId = null;
  let closestDistance = Infinity;

  Object.keys(MAP_DISTRICT_DATA).forEach(id => {
    const coord = getMapCoordinates(id);
    const radius = getCascadeMapRadius(id, id === mapState.selectedDistrictId, (MAP_DISTRICT_DATA[mapState.selectedDistrictId]?.neighbors || []).includes(id));
    const distance = Math.hypot(coord.x - x, coord.y - y);

    if (distance <= radius + 12 && distance < closestDistance) {
      closestDistance = distance;
      closestId = id;
    }
  });

  return closestId;
}

/**
 * Určenie presného partnerského pracoviska pre zastupiteľnosť danej agendy
 * v rámci príslušného regiónu (alebo pri celokrajských agendách).
 */
function getSubstitutionInfo(agendaId, districtId) {
  const ag = getAgenda(agendaId);
  const dist = getDistrict(districtId);
  if (!ag || !dist) return { partnerId: null, partnerName: null, allPartners: [], text: '' };

  // 1. Celokrajská agenda AG7 (výlučne BB)
  if (agendaId === 'AG7') {
    return {
      partnerId: null,
      partnerName: null,
      allPartners: [],
      text: 'Agenda s výlučnou celokrajskou pôsobnosťou dislokovaná v sídle kraja (bez zastúpenia iným okresom – metodické riadenie a rozhodovanie zabezpečuje priamo vedúci odboru KR).'
    };
  }

  // 2. Krajská agenda AG1 (BB <-> BR)
  if (agendaId === 'AG1') {
    const partnerId = (districtId === 'BB') ? 'BR' : 'BB';
    const p = getDistrict(partnerId);
    return {
      partnerId: p.id,
      partnerName: p.name,
      allPartners: p ? [p] : [],
      text: `Krajská agenda: pri neprítomnosti alebo zásahu zamestnanca agendu automaticky preberá partnerské krajské pracovisko <strong>${p ? p.name : ''} (${partnerId})</strong>.`
    };
  }

  // 3. Krajská agenda AG5 (BB <-> ZV)
  if (agendaId === 'AG5') {
    const partnerId = (districtId === 'BB') ? 'ZV' : 'BB';
    const p = getDistrict(partnerId);
    return {
      partnerId: p.id,
      partnerName: p.name,
      allPartners: p ? [p] : [],
      text: `Krajská agenda: pri neprítomnosti alebo zásahu zamestnanca agendu automaticky preberá partnerské krajské pracovisko <strong>${p ? p.name : ''} (${partnerId})</strong>.`
    };
  }

  // 4. Regionálne agendy (AG2, AG3, AG4, AG6) - výhradne v rámci rovnakého úzmeného regiónu
  const reg = REGIONS.find(r => r.districts.some(d => d.id === districtId));
  if (!reg) return { partnerId: null, partnerName: null, allPartners: [], text: '' };

  const partnerDistricts = reg.districts.filter(d => d.id !== districtId && d.ags.includes(agendaId));
  if (partnerDistricts.length > 0) {
    const partnerNames = partnerDistricts.map(p => `<strong>${p.name} (${p.id})</strong>`).join(', ');
    return {
      partnerId: partnerDistricts[0].id,
      partnerName: partnerDistricts[0].name,
      allPartners: partnerDistricts,
      text: `V rámci regiónu <strong>${reg.shortName}</strong> pri neprítomnosti alebo zásahu zamestnanca agendu automaticky preberá partnerské pracovisko ${partnerNames}.`
    };
  }

  return {
    partnerId: null,
    partnerName: null,
    allPartners: [],
    text: `V regióne ${reg.shortName} je agenda zabezpečená týmto pracoviskom.`
  };
}

if (typeof window !== 'undefined') {
  window.getSubstitutionInfo = getSubstitutionInfo;
}
