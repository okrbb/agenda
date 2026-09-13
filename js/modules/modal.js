/* =========================================================================
   MODAL DIALOGS MODULE
   Zobrazenie detailu bunky matice, agendy a okresného pracoviska
   ========================================================================= */

/**
 * Určenie presného partnerského pracoviska pre zastupiteľnosť danej agendy
 * v rámci príslušného regiónu (alebo pri celokrajských agendách).
 */
function getSubstitutionInfo(agendaId, districtId) {
  if (typeof window !== 'undefined' && window.getSubstitutionInfo && window.getSubstitutionInfo !== getSubstitutionInfo) {
    return window.getSubstitutionInfo(agendaId, districtId);
  }
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

function showCellDetail(agendaId, districtId) {
  const ag = getAgenda(agendaId);
  const dist = getDistrict(districtId);
  if (!ag || !dist) return;

  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const iconBox = document.getElementById('modalIconBox');
  const body = document.getElementById('modalBody');
  const modal = document.getElementById('infoModal');

  if (modalTitle) modalTitle.textContent = `${ag.id} na OÚ ${dist.name} (${dist.id})`;
  if (modalSubtitle) modalSubtitle.textContent = `${ag.name} • ${dist.regionName}`;
  
  if (iconBox) {
    iconBox.style.backgroundColor = ag.color;
    iconBox.innerHTML = `<span class="text-white font-bold text-sm">${ag.num}</span>`;
  }

  const subst = getSubstitutionInfo(agendaId, districtId);

  if (body) {
    body.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Popis agendy a činností</div>
          <p class="text-slate-800 font-medium">${ag.desc}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div class="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Pôsobnosť</div>
            <div class="font-bold text-slate-900 text-sm mt-0.5">${ag.type === 'KRAJ' ? 'Celokrajská (13 okresov)' : 'Regionálna (' + dist.regionShort + ')'}</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div class="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Okresné kapacity</div>
            <div class="font-bold text-slate-900 text-sm mt-0.5">${dist.fte} FTE (${dist.villages} obcí)</div>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs leading-relaxed">
          <div class="font-bold flex items-center space-x-1.5 mb-1 text-sky-950">
            <i class="fa-solid fa-people-arrows text-sky-700"></i>
            <span>Režim inštitucionálnej zastupiteľnosti:</span>
          </div>
          <p class="text-slate-800">${subst.text}</p>
        </div>

        <div class="pt-2 border-t border-slate-200">
          <button onclick="jumpToDistrictDispatch('${dist.id}')"
                  class="w-full py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition">
            <i class="fa-solid fa-car-side"></i>
            <span>Zobraziť dojazdy a posily pre okres ${dist.name} (${dist.id})</span>
          </button>
        </div>
      </div>
    `;
  }

  if (modal) modal.classList.remove('hidden');
}

function showAgendaModal(agendaId) {
  const ag = getAgenda(agendaId);
  if (!ag) return;

  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const iconBox = document.getElementById('modalIconBox');
  const body = document.getElementById('modalBody');
  const modal = document.getElementById('infoModal');

  if (modalTitle) modalTitle.textContent = `${ag.id} - ${ag.name}`;
  if (modalSubtitle) modalSubtitle.textContent = `Typ: ${ag.type === 'KRAJ' ? 'Celokrajská agenda' : 'Regionálna agenda'}`;
  
  if (iconBox) {
    iconBox.style.backgroundColor = ag.color;
    iconBox.innerHTML = `<span class="text-white font-bold text-sm">${ag.num}</span>`;
  }

  const distHtml = ag.coveredIn.map(dId => {
    const d = getDistrict(dId);
    return `
      <div class="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between hover:border-slate-300 transition">
        <span class="font-bold text-slate-800 text-xs">${d.name} (${d.id})</span>
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">${d.regionShort}</span>
      </div>
    `;
  }).join('');

  if (body) {
    body.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Popis a odborné činnosti</div>
          <p class="text-slate-800 font-medium">${ag.desc}</p>
        </div>

        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Garantované okresné pracoviská (${ag.coveredIn.length}):</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            ${distHtml}
          </div>
        </div>
      </div>
    `;
  }

  if (modal) modal.classList.remove('hidden');
}

function showDistrictModal(distId) {
  const dist = getDistrict(distId);
  if (!dist) return;

  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const iconBox = document.getElementById('modalIconBox');
  const body = document.getElementById('modalBody');
  const modal = document.getElementById('infoModal');

  if (modalTitle) modalTitle.textContent = `Okresný úrad ${dist.name} (${dist.id})`;
  if (modalSubtitle) modalSubtitle.textContent = `${dist.regionName} • Kapacita: ${dist.fte} FTE`;
  
  if (iconBox) {
    iconBox.style.backgroundColor = "#0284c7";
    iconBox.innerHTML = `<i class="fa-solid fa-building text-white text-sm"></i>`;
  }

  const agHtml = dist.ags.map(agId => {
    const a = getAgenda(agId);
    const subst = getSubstitutionInfo(agId, dist.id);
    return `
      <div class="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center shrink-0" style="background-color: ${a.color}">${a.num}</span>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-slate-800 text-xs">${a.id}</span>
              <span class="text-[11px] text-slate-600 truncate max-w-[190px]">${a.name}</span>
            </div>
            ${subst && subst.partnerId ? `<div class="text-[10px] text-slate-400">Zastupiteľnosť: <span class="font-semibold text-slate-700">${subst.partnerName} (${subst.partnerId})</span></div>` : ''}
          </div>
        </div>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.type === 'KRAJ' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'}">${a.type}</span>
      </div>
    `;
  }).join('');

  if (body) {
    body.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-slate-500 font-medium">Spravované územie:</span>
            <div class="text-sm font-bold text-slate-900">${dist.villages} obcí</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-slate-500 font-medium">Zaťaženie na osobu:</span>
            <div class="text-sm font-bold text-slate-900">${(dist.villages / dist.fte).toFixed(1)} obce / FTE</div>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Garantované odborné agendy na pracovisku:</div>
          <div class="space-y-1.5">
            ${agHtml}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-200">
          <button onclick="jumpToDistrictDispatch('${dist.id}')"
                  class="w-full py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition">
            <i class="fa-solid fa-car-side"></i>
            <span>Zobraziť dojazdy a posily pre okres ${dist.name} (${dist.id})</span>
          </button>
        </div>
      </div>
    `;
  }

  if (modal) modal.classList.remove('hidden');
}

function jumpToDistrictDispatch(distId) {
  closeModal();
  if (typeof switchTab === 'function') {
    switchTab('cascadeTab');
  }
  setTimeout(() => {
    const select = document.getElementById('dispatchDistrictSelect');
    if (select) {
      select.value = distId;
      if (typeof runDispatchSimulation === 'function') {
        runDispatchSimulation();
      }
    }
    const target = document.getElementById('dispatchDistrictSelect');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);
}

function closeModal() {
  const modal = document.getElementById('infoModal');
  if (modal) modal.classList.add('hidden');
}

// Global modal listeners
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

const infoModal = document.getElementById('infoModal');
if (infoModal) {
  infoModal.addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') closeModal();
  });
}
