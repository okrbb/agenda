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

function updateScrollProgressBar() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight > 0) {
    const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
    bar.style.width = `${pct}%`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  // Reset scroll position on initial load
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  // 1. Render Matrix
  renderMatrix();

  // 2. Render Catalog & Regions
  renderAgendasCatalog();
  renderRegionsOverview();
  renderComparisonTable('all');

  // 3. Render Travel & Cascade Map
  renderTravelMatrixTable('KA');
  initCascadeMap();
  setCascadeLevel(1, false);
  runDispatchSimulation();

  // 4. Initialize UI state
  updateScrollTopButton();
  updateScrollProgressBar();

  // Scroll to top button action
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  }
});

window.addEventListener('scroll', () => {
  updateScrollTopButton();
  updateScrollProgressBar();
}, { passive: true });

window.addEventListener('resize', () => {
  setTimeout(() => {
    if (typeof renderCascadeMap === 'function') renderCascadeMap();
  }, 150);
});

/* =========================================================================
   FULLSCREEN CONTROLLER (Mapa)
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
    if (typeof renderCascadeMap === 'function') {
      renderCascadeMap();
    }
  }, 200);
});

window.toggleFullscreen = toggleFullscreen;

