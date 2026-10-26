(() => {
  const ticker = document.querySelector('.tools-ticker');
  if (!ticker) return;
  const viewport = ticker.querySelector('.tools-window');
  const track = ticker.querySelector('.tools-track');
  const group = track.querySelector('.tools-group');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const baseSpeed = 45;
  let visible = false, paused = false, dragging = false;
  let startX = 0, startOffset = 0, offset = 0, width = 1, duration = 1, animation;
  let lastX = 0, lastMove = 0, velocity = 0, moved = false, coastFrame = 0;
  const wrap = value => ((value % width) + width) % width;
  const stopCoast = () => {
    cancelAnimationFrame(coastFrame); coastFrame = 0;
    if (animation) animation.playbackRate = 1;
    ticker.dataset.inertia = 'false';
  };
  const sync = () => {
    const run = visible && !paused && !dragging && !document.hidden && !motion.matches;
    if (!run) stopCoast();
    if (animation) run ? animation.play() : animation.pause();
    ticker.dataset.paused = String(paused || dragging);
    viewport.setAttribute('aria-label', 'Tool logos. Hold and drag to explore; release to resume. Arrow keys move logos. Space pauses or resumes.');
  };
  const rebuild = () => {
    const fraction = animation ? (Number(animation.currentTime || 0) % duration) / duration : offset / width;
    stopCoast(); animation?.cancel();
    width = Math.max(1, group.getBoundingClientRect().width);
    duration = width / baseSpeed * 1000;
    animation = track.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${width}px)` }], { duration, iterations: Infinity, easing: 'linear' });
    animation.currentTime = fraction * duration;
    sync();
  };
  const coast = speed => {
    if (!visible || document.hidden || motion.matches || Math.abs(speed) < 70) return;
    let rate = Math.max(-12, Math.min(12, speed / baseSpeed));
    // Start one cycle ahead so a rightward flick cannot hit time zero.
    animation.currentTime = Number(animation.currentTime || 0) + duration;
    animation.playbackRate = rate;
    ticker.dataset.inertia = 'true';
    let previous = performance.now();
    const tick = now => {
      const dt = Math.min(now - previous, 50); previous = now;
      rate = 1 + (rate - 1) * Math.exp(-dt / 260);
      animation.playbackRate = rate;
      if (Math.abs(rate - 1) < .025) { stopCoast(); return; }
      coastFrame = requestAnimationFrame(tick);
    };
    coastFrame = requestAnimationFrame(tick);
  };
  viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0 || motion.matches) return;
    stopCoast();
    dragging = true; paused = false; moved = false; velocity = 0;
    startX = lastX = e.clientX; lastMove = performance.now();
    offset = Number(animation.currentTime || 0) / duration * width % width;
    startOffset = offset;
    animation.cancel(); animation = null;
    track.style.transform = `translateX(-${offset}px)`;
    viewport.setPointerCapture(e.pointerId); sync();
  });
  viewport.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; viewport.classList.add('is-dragging'); }
    if (moved) {
      const dt = Math.max(8, now - lastMove);
      const sample = Math.max(-900, Math.min(900, (lastX - e.clientX) / dt * 1000));
      velocity = velocity * .35 + sample * .65;
      offset = wrap(startOffset - dx);
      track.style.transform = `translateX(-${offset}px)`;
    }
    lastX = e.clientX; lastMove = now;
  });
  const finish = e => {
    if (!dragging) return;
    dragging = false; paused = false;
    const speed = moved && e.type !== 'pointercancel' && performance.now() - lastMove < 140 ? velocity : 0;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    rebuild(); coast(speed);
  };
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('lostpointercapture', () => {
    if (dragging) { dragging = false; paused = false; viewport.classList.remove('is-dragging'); rebuild(); }
  });
  viewport.addEventListener('pointerleave', () => { if (!dragging) { paused = false; sync(); } });
  viewport.addEventListener('dragstart', e => e.preventDefault());
  viewport.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); paused = !paused; sync(); }
    if (!motion.matches && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault(); stopCoast();
      animation.currentTime = ((Number(animation.currentTime || 0) + (e.key === 'ArrowRight' ? 2200 : -2200)) % duration + duration) % duration;
      paused = false; sync();
    }
  });
  new ResizeObserver(rebuild).observe(group);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(ticker);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', rebuild);
  rebuild();
})();
