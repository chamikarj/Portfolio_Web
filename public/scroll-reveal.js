(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const nodes = [...document.querySelectorAll('.section-head, .video-layout, .education-timeline, .work-heading, .work-card, .contact-inner, .social-panel, .message-panel')];
  const show = node => {
    node.classList.add('is-revealed');
    observer.unobserve(node);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) show(entry.target);
  }, { threshold: .06, rootMargin: '0px 0px -24px 0px' });
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    // Already visible content should never flash or move during initialization.
    if (rect.top < innerHeight && rect.bottom > 0) continue;
    node.classList.add('scroll-reveal');
    observer.observe(node);
    node.addEventListener('focusin', () => show(node), { once: true });
  }
  motion.addEventListener('change', event => {
    if (event.matches) { nodes.forEach(node => node.classList.add('is-revealed')); observer.disconnect(); }
  });
  // Restore visibility on browser back/forward restoration.
  addEventListener('pageshow', event => {
    if (event.persisted) { nodes.forEach(node => node.classList.add('is-revealed')); observer.disconnect(); }
  });
})();
