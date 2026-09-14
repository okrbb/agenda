/* =========================================================================
   TOAST NOTIFICATIONS
   Jednoduché, elegantné notifikačné bubliny bez prekrývania
   ========================================================================= */

let currentToastTimer = null;

function showToast(message, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Ak už beží časovač alebo je zobrazený toast, okamžite vyčistíme kontajner, aby sa nikdy neprekrývali
  if (currentToastTimer) {
    clearTimeout(currentToastTimer);
    currentToastTimer = null;
  }
  container.innerHTML = '';

  const toast = document.createElement('div');
  
  const icons = {
    info: '<i class="fa-solid fa-circle-info text-sky-400"></i>',
    success: '<i class="fa-solid fa-circle-check text-emerald-400"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i>'
  };

  toast.className = "pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 transform transition-all duration-200 -translate-y-2 opacity-0 max-w-md";
  toast.innerHTML = `
    <div class="flex items-center space-x-2.5">
      <span class="text-sm shrink-0">${icons[type] || icons.info}</span>
      <span class="font-medium leading-snug">${message}</span>
    </div>
    <button type="button" class="text-slate-400 hover:text-white text-xs p-1 ml-2 shrink-0 transition" title="Zavrieť" onclick="this.closest('.pointer-events-auto').remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-2', 'opacity-0');
  });

  currentToastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 200);
  }, 3500);
}

