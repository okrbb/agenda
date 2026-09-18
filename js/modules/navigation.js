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
 * Inicializácia obojsmerného ScrollSpy pre sticky navigačnú lištu
 */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.subnav-link, .floating-dock-pill');
  if (!navLinks.length) return;

  const sectionIds = Array.from(navLinks).map(link => link.getAttribute('data-section')).filter(Boolean);
  const uniqueSectionIds = [...new Set(sectionIds)];
  const sections = uniqueSectionIds.map(id => document.getElementById(id)).filter(Boolean);

  if (!sections.length) return;

  function setActiveLink(activeId) {
    navLinks.forEach(link => {
      const linkSection = link.getAttribute('data-section');
      if (linkSection === activeId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // Použitie IntersectionObserver s upraveným horným/dolným offsetom
  const observerOptions = {
    root: null,
    rootMargin: '-15% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  // Kliknutie na link v navigácii
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const secId = link.getAttribute('data-section');
      if (secId) {
        scrollToSection(secId);
        setActiveLink(secId);
      }
    });
  });
}

/**
 * Zbalenie / rozbalenie bočného navigačného docku
 */
function toggleNavDockCollapse() {
  const dock = document.getElementById('floatingNavDock');
  const icon = document.getElementById('dockCollapseIcon');
  if (!dock) return;
  const isCollapsed = dock.classList.toggle('is-collapsed');
  if (icon) {
    icon.className = isCollapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
  }
  try {
    localStorage.setItem('okr_nav_dock_collapsed', isCollapsed ? 'true' : 'false');
  } catch (e) {}
}

/**
 * Obnovenie preferencie zbalenia navigačného docku
 */
function restoreNavDockState() {
  const dock = document.getElementById('floatingNavDock');
  const icon = document.getElementById('dockCollapseIcon');
  if (!dock) return;
  try {
    if (localStorage.getItem('okr_nav_dock_collapsed') === 'true') {
      dock.classList.add('is-collapsed');
      if (icon) icon.className = 'fa-solid fa-chevron-right';
    }
  } catch (e) {}
}

window.toggleNavDockCollapse = toggleNavDockCollapse;

// Inicializácia pri načítaní DOM
function initNavigation() {
  initScrollSpy();
  restoreNavDockState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
