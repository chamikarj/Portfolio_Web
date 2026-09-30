(() => {
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    let titleInView = true;
    const syncTitleMotion = () => heroTitle.classList.toggle('is-paused', document.hidden || !titleInView);
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

  const glass = document.querySelectorAll('.glass');
  for (const panel of glass) {
    panel.addEventListener('pointermove', event => {
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty('--px', `${event.clientX - bounds.left}px`);
      panel.style.setProperty('--py', `${event.clientY - bounds.top}px`);
    }, { passive: true });
  }

  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('ripple-canvas');
  const orb = document.querySelector('.gel-orb');
  const ctx = canvas.getContext('2d');
  if (!ctx || !orb) return;

  let width = 0, height = 0, x = -200, y = -200, targetX = -200, targetY = -200;
  let lastX = -200, lastY = -200, lastRipple = 0, frameId = 0, visible = false;
  let ripples = [];

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function addRipple(px, py, now, strength = 1) {
    ripples.push({ x: px, y: py, born: now, strength });
    if (ripples.length > 24) ripples.shift();
  }

  function animate(now) {
    ctx.clearRect(0, 0, width, height);
    x += (targetX - x) * .17;
    y += (targetY - y) * .17;
    orb.style.transform = `translate3d(${x - 74}px, ${y - 74}px, 0)`;

    ripples = ripples.filter(ripple => now - ripple.born < 900);
    for (const ripple of ripples) {
      const progress = (now - ripple.born) / 900;
      const fade = (1 - progress) ** 2 * ripple.strength;
      const radius = 8 + progress * 120;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(152, 229, 251, ${.28 * fade})`;
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius * .68, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(184, 161, 255, ${.14 * fade})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    frameId = visible || ripples.length ? requestAnimationFrame(animate) : 0;
  }

  function start() { if (!frameId) frameId = requestAnimationFrame(animate); }
  function leave() { visible = false; orb.classList.remove('active'); start(); }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) { x = targetX; y = targetY; visible = true; orb.classList.add('active'); }
    const now = performance.now();
    if (now - lastRipple > 75 && Math.hypot(targetX - lastX, targetY - lastY) > 28) {
      addRipple(targetX, targetY, now);
      lastRipple = now; lastX = targetX; lastY = targetY;
    }
    start();
  }, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      addRipple(event.clientX, event.clientY, performance.now(), 1.5);
      start();
    }
  }, { passive: true });
  document.addEventListener('mouseleave', leave);
  window.addEventListener('blur', leave);
  resize();
})();
