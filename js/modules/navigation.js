/* =========================================================================
   NAVIGATION & SCROLLSPY MODULE
   Plávajúce ľavé menu (Pill Dock), plynulý posun sekcií a automatický ScrollSpy
   ========================================================================= */

// Mapovanie pôvodných ID tabov na ID sekcií feedu pre spätnú kompatibilitu
const TAB_TO_SECTION_MAP = {
  'matrixTab': 'section-matrix',
  'agendasTab': 'section-agendas',
  'cascadeTab': 'section-cascade',
  'comparisonTab': 'section-comparison',
  'mapTab': 'section-map'
};

/**
 * Plynulé posunutie na konkrétnu sekciu feedu
 * @param {string} sectionId - ID cieľovej sekcie (s alebo bez prefixu)
 */
function scrollToSection(sectionId) {
  const targetId = TAB_TO_SECTION_MAP[sectionId] || sectionId;
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  // Ak ide o sekciu s mapou, obnovíme canvas
  if ((targetId === 'section-cascade' || targetId === 'section-map') && typeof renderCascadeMap === 'function') {
    setTimeout(() => {
      renderCascadeMap();
    }, 120);
  }

  targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Spätná kompatibilita pre switchTab (napr. volania z modálov a tabuliek)
 */
function switchTab(tabId) {
  scrollToSection(tabId);
}

/**
 * Rýchly posun na porovnávaciu tabuľku okresov
 */
function scrollToComparisonMatrix() {
  const el = document.getElementById('districtComparisonAnchor');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Inicializácia obojsmerného ScrollSpy pre plávajúci Pill Dock
 */
function initScrollSpy() {
  const dockPills = document.querySelectorAll('.floating-dock-pill');
  if (!dockPills.length) return;

  const sectionIds = Array.from(dockPills).map(pill => pill.getAttribute('data-section')).filter(Boolean);
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  if (!sections.length) return;

  function setActivePill(activeId) {
    dockPills.forEach(pill => {
      const pillSection = pill.getAttribute('data-section');
      if (pillSection === activeId) {
        pill.classList.add('active');
        pill.setAttribute('aria-current', 'true');
      } else {
        pill.classList.remove('active');
        pill.removeAttribute('aria-current');
      }
    });
  }

  // Použitie IntersectionObserver s upraveným horným/dolným offsetom
  const observerOptions = {
    root: null,
    rootMargin: '-18% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActivePill(entry.target.id);
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  // Kliknutie na pill v docku
  dockPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const secId = pill.getAttribute('data-section');
      if (secId) {
        scrollToSection(secId);
        setActivePill(secId);
      }
    });
  });
}

// Inicializácia pri načítaní DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollSpy);
} else {
  initScrollSpy();
}
