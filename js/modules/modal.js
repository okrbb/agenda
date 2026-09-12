/* =========================================================================
   MODAL DIALOGS MODULE
   Zobrazenie detailu bunky matice, agendy a okresného pracoviska
   ========================================================================= */

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

        <div class="p-3 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs">
          <strong>Režim zastupiteľnosti:</strong> Ak okresný zamestnanec čerpá dovolenku alebo zasahuje v teréne, agendu automaticky preberá partnerské pracovisko v regióne (pre ${ag.id}: ${ag.coveredIn.filter(x => x !== dist.id).join(', ')}).
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

  if (modalTitle) modalTitle.textContent = `${ag.id}: ${ag.name}`;
  if (modalSubtitle) modalSubtitle.textContent = `Celková alokácia: ${ag.fteTotal} FTE v kraji`;
  
  if (iconBox) {
    iconBox.style.backgroundColor = ag.color;
    iconBox.innerHTML = `<span class="text-white font-bold text-sm">${ag.num}</span>`;
  }

  if (body) {
    body.innerHTML = `
      <div class="space-y-3">
        <p class="text-slate-700">${ag.desc}</p>

        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pracoviská garantujúce túto agendu (${ag.coveredIn.length}):</div>
          <div class="flex flex-wrap gap-1.5">
            ${ag.coveredIn.map(dId => {
              const d = getDistrict(dId);
              return `<span class="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-sm">${d ? d.name + ' (' + d.id + ')' : dId}</span>`;
            }).join('')}
          </div>
        </div>

        <div class="text-xs text-slate-500">
          <strong>Kategória:</strong> ${ag.scope}
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
    return `
      <div class="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center" style="background-color: ${a.color}">${a.num}</span>
          <div>
            <span class="font-bold text-slate-800 text-xs">${a.id}</span>
            <span class="text-[11px] text-slate-500 block truncate max-w-[200px]">${a.name}</span>
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
      </div>
    `;
  }

  if (modal) modal.classList.remove('hidden');
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
