(() => {
  const orbit = document.querySelector('.contact-orbit');
  if (!orbit) return;

  const icons = [
    { name: 'Java', slug: 'java', mark: 'J', color: '#f3a760' },
    { name: 'Python', slug: 'python', mark: 'Py', color: '#f8d96a' },
    { name: 'JavaScript', slug: 'javascript', mark: 'JS', color: '#f7df1e' },
    { name: 'HTML5', slug: 'html5', mark: 'H5', color: '#f08060' },
    { name: 'CSS3', slug: 'css3', mark: 'C3', color: '#67b7f7' },
    { name: 'IntelliJ IDEA', slug: 'intellij', mark: 'IJ', color: '#e38bdb' },
    { name: 'VS Code', slug: 'vscode', mark: 'VS', color: '#65c7fa' },
    { name: 'Selenium', slug: 'selenium', mark: 'Se', color: '#8bdc80' },
    { name: 'Git', slug: 'git', mark: 'Git', color: '#f19274' },
    { name: 'MySQL', slug: 'mysql', mark: 'SQL', color: '#88c6e7' },
  ];
  const positions = [0, 0];
  const nodes = icons.map((icon, index) => {
    const ring = index % 2;
    const phase = positions[ring]++ * Math.PI * 2 / 5 + (ring ? .6 : 0);
    const badge = document.createElement('span');
    badge.className = 'contact-orbit-logo';
    badge.style.setProperty('--logo-color', icon.color);
    badge.style.setProperty('--logo-glow', `${icon.color}33`);

    const mark = document.createElement('span');
    mark.className = 'contact-orbit-mark';
    mark.textContent = icon.mark;
    const image = document.createElement('img');
    image.alt = '';
    image.width = 27;
    image.height = 27;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => badge.classList.add('has-icon'));
    image.src = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${icon.slug}/${icon.slug}-original.svg`;
    badge.append(mark, image);
    orbit.append(badge);
    return { badge, ring, phase };
  });

  let visible = !('IntersectionObserver' in window);
  let running = false;
  let frameId = 0;
  let previousTime = 0;
  let elapsed = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function draw() {
    const width = orbit.clientWidth;
    const height = orbit.clientHeight;
    const centerX = width * .52;
    const centerY = height * .52;
    for (const { badge, ring, phase } of nodes) {
      const angle = phase + elapsed * (ring ? -Math.PI * 2 / 19 : Math.PI * 2 / 28);
      const radiusX = width * (ring ? .30 : .45);
      const radiusY = height * (ring ? .27 : .39);
      const tilt = ring ? .24 : -.17;
      const flatX = Math.cos(angle) * radiusX;
      const flatY = Math.sin(angle) * radiusY;
      const x = centerX + flatX * Math.cos(tilt) - flatY * Math.sin(tilt);
      const y = centerY + flatX * Math.sin(tilt) + flatY * Math.cos(tilt);
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = .65 + depth * .52;
      badge.style.transform = `translate3d(${(x - 22).toFixed(1)}px, ${(y - 22).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      badge.style.opacity = (.22 + depth * .5).toFixed(3);
    }
  }

  function animate(now) {
    if (!running) return;
    if (previousTime) elapsed += Math.min((now - previousTime) / 1000, .05);
    previousTime = now;
    draw();
    frameId = requestAnimationFrame(animate);
  }

  function updateMotion() {
    const shouldRun = visible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !running) {
      running = true;
      previousTime = 0;
      frameId = requestAnimationFrame(animate);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frameId);
      previousTime = 0;
    }
    if (!shouldRun) draw();
  }

  draw();
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(orbit);
  else window.addEventListener('resize', draw);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    }, { rootMargin: '80px 0px', threshold: 0 }).observe(orbit);
  }
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
})();
