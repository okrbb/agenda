/* =========================================================================
   NAVIGATION MODULE
   Správa záložiek (tabov) a plynulého posunu
   ========================================================================= */

let currentTab = 'matrixTab';

function switchTab(tabId) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  currentTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const activeContent = document.getElementById(tabId);
  if (activeContent) activeContent.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-sky-500', 'text-sky-400', 'border-amber-400', 'text-amber-300', 'font-semibold');
    btn.classList.add('border-transparent', 'text-slate-400');
  });
  const activeBtn = document.getElementById('tabBtn-' + tabId);
  if (activeBtn) {
    if (tabId === 'comparisonTab') {
      activeBtn.classList.add('border-amber-400', 'text-amber-300', 'font-semibold');
    } else {
      activeBtn.classList.add('border-sky-500', 'text-sky-400', 'font-semibold');
    }
    activeBtn.classList.remove('border-transparent', 'text-slate-400');
  }

  if (tabId === 'sankeyTab') {
    setTimeout(() => {
      Plotly.Plots.resize('plotlySankey').then(() => {
        if (typeof alignSankeyLabels === 'function') alignSankeyLabels();
      });
    }, 100);
  }

  if (tabId === 'cascadeTab') {
    setTimeout(() => {
      if (typeof renderCascadeMap === 'function') renderCascadeMap();
      if (typeof runDispatchSimulation === 'function') runDispatchSimulation();
    }, 120);
  }
}

function scrollToComparisonMatrix() {
  const el = document.getElementById('districtComparisonAnchor');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
