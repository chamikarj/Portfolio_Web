(() => {
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    let titleInView = true;
    const syncTitleMotion = () => {
      const paused = document.hidden || !titleInView;
      heroTitle.classList.toggle('is-paused', paused);
      heroTitle.closest('.hero')?.classList.toggle('is-motion-paused', paused);
    };
    if ('IntersectionObserver' in window) {
      const titleObserver = new IntersectionObserver(([entry]) => {
        titleInView = entry.isIntersecting;
        syncTitleMotion();
      });
      titleObserver.observe(heroTitle);
    }
    document.addEventListener('visibilitychange', syncTitleMotion);
    syncTitleMotion();
  }

  const orb = document.querySelector('.gel-orb');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!orb || !matchMedia('(pointer: fine)').matches) return;
  let frame = 0, x = 0, y = 0;
  const hide = () => { cancelAnimationFrame(frame); frame = 0; orb.classList.remove('active'); };
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || motion.matches || document.hidden) { hide(); return; }
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      orb.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
      orb.classList.add('active');
    });
  }, { passive: true });
  document.addEventListener('mouseleave', hide);
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('blur', hide);
  motion.addEventListener('change', hide);
})();
