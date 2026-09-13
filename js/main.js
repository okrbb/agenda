/* =========================================================================
   APPLICATION ENTRY POINT & INITIALIZATION
   Koordinácia inicializácie všetkých komponentov aplikácie OKR BBK
   ========================================================================= */

function updateScrollTopButton() {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  if (!scrollToTopBtn) return;
  const shouldShow = window.scrollY > 280;
  scrollToTopBtn.classList.toggle('hidden', !shouldShow);
}

window.addEventListener('DOMContentLoaded', () => {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  // Reset scroll position on initial load
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  // 1. Render Plotly Sankey diagram
  renderSankey();
  setTimeout(() => {
    if (window.Plotly) {
      Plotly.Plots.resize('plotlySankey').then(() => {
        if (typeof alignSankeyLabels === 'function') alignSankeyLabels();
      });
    }
  }, 150);

  // 2. Render Matrix
  renderMatrix();

  // 3. Render Catalog & Regions
  renderAgendasCatalog();
  renderRegionsOverview();
  renderComparisonTable('all');

  // 4. Render Travel & Cascade Map
  renderTravelMatrixTable('KA');
  initCascadeMap();
  setCascadeLevel(1, false);
  runDispatchSimulation();

  // 5. Initialize UI state
  updateScrollTopButton();

  // Scroll to top button action
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  }
});

window.addEventListener('scroll', () => {
  updateScrollTopButton();
}, { passive: true });

window.addEventListener('resize', () => {
  setTimeout(() => {
    if (typeof alignSankeyLabels === 'function') alignSankeyLabels();
    if (typeof renderCascadeMap === 'function') renderCascadeMap();
  }, 150);
});

/* =========================================================================
   FULLSCREEN CONTROLLER (Sankey & Map)
   ========================================================================= */
function toggleFullscreen(elementId) {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

document.addEventListener('fullscreenchange', () => {
  setTimeout(() => {
    if (window.Plotly) {
      Plotly.Plots.resize('plotlySankey').then(() => {
        if (typeof alignSankeyLabels === 'function') alignSankeyLabels();
      });
    }
    if (typeof renderCascadeMap === 'function') {
      renderCascadeMap();
    }
  }, 200);
});

window.toggleFullscreen = toggleFullscreen;

