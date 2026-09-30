(() => {
  const heading = document.getElementById('videos-title');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!heading || reducedMotion.matches) return;

  const message = heading.textContent.trim();
  const accessible = document.createElement('span');
  accessible.className = 'terminal-title-a11y';
  accessible.textContent = message;

  const reserve = document.createElement('span');
  reserve.className = 'terminal-title-reserve';
  reserve.setAttribute('aria-hidden', 'true');
  reserve.textContent = message;

  const typed = document.createElement('span');
  typed.className = 'terminal-title-typed';
  typed.setAttribute('aria-hidden', 'true');
  heading.replaceChildren(accessible, reserve, typed);

  let started = false;
  let stopped = false;
  function start() {
    if (started) return;
    started = true;
    const began = performance.now();
    let previous = -1;
    function tick(now) {
      if (stopped) return;
      const count = Math.min(message.length, Math.floor((now - began) / 90));
      if (count !== previous) {
        typed.textContent = message.slice(0, count);
        previous = count;
      }
      if (count < message.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    stopped = true;
    typed.textContent = message;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      start();
      observer.disconnect();
    }, { threshold: .5, rootMargin: '0px 0px -8% 0px' });
    observer.observe(heading);
  } else {
    start();
  }
})();
