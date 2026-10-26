(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('intro-enabled');
  const ready = () => requestAnimationFrame(() => root.classList.add('intro-ready'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  // Never keep the opening on screen after back/forward navigation.
  addEventListener('pageshow', event => { if (event.persisted) root.classList.remove('intro-enabled', 'intro-ready'); });
})();
