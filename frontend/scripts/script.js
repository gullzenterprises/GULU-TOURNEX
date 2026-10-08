(() => {
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const opener = document.querySelector('[data-drawer-open]');
  const closer = document.querySelector('.drawer-close');
  const toast = document.getElementById('demo-toast');
  let previousFocus = null;
  let toastTimer;
  function openDrawer() {
    if (!drawer || !backdrop || !opener) return;
    previousFocus = document.activeElement;
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    opener.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      closer?.focus();
    });
  }
  function closeDrawer(restore = true) {
    if (!drawer || !backdrop || !opener) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    opener.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
    window.setTimeout(() => { if (!drawer.classList.contains('is-open')) backdrop.hidden = true; }, 280);
    if (restore) (previousFocus instanceof HTMLElement ? previousFocus : opener).focus();
  }
  opener?.addEventListener('click', openDrawer);
  closer?.addEventListener('click', () => closeDrawer());
  backdrop?.addEventListener('click', () => closeDrawer());
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDrawer(false)));
  document.addEventListener('keydown', event => {
    if (!drawer?.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')].filter(el => !el.hidden);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === drawer)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4000);
  }
  document.querySelectorAll('[data-demo-action]').forEach(button => button.addEventListener('click', () => {
    const messages = {search:'Search is a visual demo control. Tournament search is not active yet.',login:'Login is a preview only. Accounts are not active.',signup:'Sign up is a preview only. Account creation is not active.'};
    showToast(messages[button.dataset.demoAction] || 'This is a frontend demo control.');
  }));
  document.querySelectorAll('[data-demo-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    showToast('Thanks for trying the preview. This demo does not send or save form data.');
  }));
})();