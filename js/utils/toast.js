/* =========================================================================
   TOAST NOTIFICATIONS
   Jednoduché a elegantné notifikačné bubliny v pravom dolnom rohu
   ========================================================================= */

function showToast(message, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  
  const icons = {
    info: '<i class="fa-solid fa-circle-info text-sky-500"></i>',
    success: '<i class="fa-solid fa-circle-check text-emerald-500"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>'
  };

  toast.className = "pointer-events-auto bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-2.5 transform transition-all duration-300 translate-y-2 opacity-0";
  toast.innerHTML = `
    <span>${icons[type] || icons.info}</span>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
