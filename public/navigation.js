(() => {
  const nav = document.querySelector('.nav');
  const connect = document.getElementById('hero-connect');
  if (!nav || !connect) return;
  const links = [...nav.querySelectorAll('a[href^="#"]'), connect];
  const sections = ['top', 'videos', 'about', 'experience', 'contact'].map((id, i) => ({ element: document.getElementById(id), link: links[i] }));
  const header = document.querySelector('.header');
  const syncHeader = () => document.documentElement.style.setProperty('--section-header', `${header.offsetHeight}px`);
  syncHeader();
  new ResizeObserver(syncHeader).observe(header);
  let pending = false;
  const update = () => {
    pending = false;
    const line = Math.max(160, Math.min(innerHeight * .28, 260));
    let active = links[0];
    for (const { element, link } of sections) if (element && element.getBoundingClientRect().top <= line) active = link;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 8) active = connect;
    for (const link of links) {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    document.querySelector('.header').classList.toggle('is-scrolled', scrollY > 8);
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  update();
})();
