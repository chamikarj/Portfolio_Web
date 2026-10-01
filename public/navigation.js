(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  // Work begins within About; Connect begins at the contact section above its cards.
  const sections = [
    ['top', '#top'],
    ['videos', '#videos'],
    ['about', '#about'],
    ['experience', '#experience'],
    ['contact', '#connect'],
  ].map(([id, href]) => ({ element: document.getElementById(id), link: nav.querySelector(`a[href="${href}"]`) }));
  if (sections.some(({ element, link }) => !element || !link)) return;

  const heroLink = document.getElementById('hero-connect');
  const heroAnchor = document.getElementById('hero-connect-anchor');
  const dockLink = nav.querySelector('.nav-contact');
  const dockSlot = nav.querySelector('.connect-slot');
  const hasFloatingConnect = !!(heroLink && heroAnchor && dockLink && dockSlot);
  const brand = document.querySelector('.brand');
  let brandAnchor = null;
  let brandSlot = null;
  if (brand) {
    brandAnchor = document.createElement('span');
    brandAnchor.className = 'brand-anchor';
    brandAnchor.setAttribute('aria-hidden', 'true');
    brand.before(brandAnchor);
    brandSlot = document.createElement('span');
    brandSlot.className = 'brand-slot';
    brandSlot.setAttribute('aria-hidden', 'true');
    nav.prepend(brandSlot);
    nav.closest('.header').append(brand);
    brand.classList.add('is-floating');
  }
  if (hasFloatingConnect) {
    nav.classList.add('has-floating-connect');
    nav.setAttribute('aria-owns', heroLink.id);
    dockLink.setAttribute('aria-hidden', 'true');
    dockLink.tabIndex = -1;
    nav.closest('.header').append(heroLink);
    heroLink.classList.add('is-floating');
  }

  const droplet = document.createElement('span');
  droplet.className = 'nav-droplet';
  droplet.setAttribute('aria-hidden', 'true');
  nav.prepend(droplet);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compactLayout = matchMedia('(max-width: 940px)');
  let activeLink = null;
  let pending = false;
  let positioned = false;
  let lastDocked = scrollY > 0;
  let connectProgress = lastDocked ? 1 : 0;
  let connectFrame = null;
  let dropletRestoreFrame = null;

  function restoreDropletTransition() {
    if (dropletRestoreFrame !== null) cancelAnimationFrame(dropletRestoreFrame);
    dropletRestoreFrame = requestAnimationFrame(() => {
      dropletRestoreFrame = null;
      if (connectFrame === null) droplet.style.removeProperty('transition');
    });
  }

  function renderFloatingConnect(progress) {
    if (!hasFloatingConnect) return;
    nav.style.setProperty('--dock-progress', progress.toFixed(3));
    nav.style.setProperty('--dock-background-alpha', (.76 * progress).toFixed(3));
    nav.style.setProperty('--dock-border-alpha', (.27 * progress).toFixed(3));
    nav.style.setProperty('--dock-shadow-alpha', (.48 * progress).toFixed(3));
    nav.style.setProperty('--dock-inset-alpha', (.15 * progress).toFixed(3));
    nav.style.setProperty('--dock-blur', `${(24 * progress).toFixed(2)}px`);
    nav.style.setProperty('--dock-saturation', (1 + .45 * progress).toFixed(3));
    nav.style.setProperty('--active-background-alpha', (.08 * progress).toFixed(3));
    nav.style.setProperty('--active-shadow-alpha', (.28 * progress).toFixed(3));
    nav.style.setProperty('--dock-gutter', `${(8 * progress).toFixed(2)}px`);

    // On phones the logo and Connect stay on the first row of the same dock.
    // Keep all four section links visible instead of squeezing them into a scroller.
    if (compactLayout.matches) {
      if (brand) brand.style.removeProperty('transform');
      if (brandSlot) brandSlot.style.setProperty('--brand-slot-width', '0px');
      dockSlot.style.setProperty('--slot-width', '0px');
      heroLink.style.removeProperty('transform');
      if (activeLink && activeLink !== dockLink) positionDroplet(activeLink, false);
      return;
    }

    if (brandAnchor && brandSlot) {
      const brandStart = brandAnchor.getBoundingClientRect();
      // The anchor scrolls with the page; the visible logo is fixed to the viewport.
      const brandStartY = brandStart.top + scrollY;
      brandSlot.style.setProperty('--brand-slot-width', `${brandStart.width * progress}px`);
      const brandEnd = brandSlot.getBoundingClientRect();
      const brandX = brandStart.left + (brandEnd.left - brandStart.left) * progress;
      const brandY = brandStartY + (brandEnd.top + (brandEnd.height - brandStart.height) / 2 - brandStartY) * progress;
      brand.style.transform = `translate3d(${brandX}px, ${brandY}px, 0)`;
    }

    const start = heroAnchor.getBoundingClientRect();
    dockSlot.style.setProperty('--slot-width', `${start.width * progress}px`);
    const end = dockSlot.getBoundingClientRect();
    const x = start.left + (end.left - start.left) * progress;
    const y = start.top + (end.top + (end.height - start.height) / 2 - start.top) * progress;
    heroLink.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // The brand slot moves Home while the dock grows; keep the highlight on the link.
    if (activeLink && activeLink !== dockLink) {
      droplet.style.transition = 'none';
      positionDroplet(activeLink, false);
      if (connectFrame === null) restoreDropletTransition();
    }
  }

  function animateFloatingConnect(startTime, from, to, duration) {
    const step = (now) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - elapsed) ** 2;
      connectProgress = from + (to - from) * eased;
      renderFloatingConnect(connectProgress);
      if (elapsed < 1) connectFrame = requestAnimationFrame(step);
      else {
        connectFrame = null;
        restoreDropletTransition();
      }
    };
    connectFrame = requestAnimationFrame(step);
  }

  function updateFloatingConnect() {
    if (!hasFloatingConnect) return;
    const docked = scrollY > 0;
    if (docked === lastDocked) return;
    lastDocked = docked;
    if (connectFrame !== null) cancelAnimationFrame(connectFrame);
    if (dropletRestoreFrame !== null) cancelAnimationFrame(dropletRestoreFrame);
    dropletRestoreFrame = null;
    const destination = docked ? 1 : 0;
    const remaining = Math.abs(destination - connectProgress);
    if (reducedMotion.matches || remaining < .001) {
      connectProgress = destination;
      connectFrame = null;
      renderFloatingConnect(connectProgress);
      return;
    }
    animateFloatingConnect(performance.now(), connectProgress, destination, 480 * remaining);
  }

  function positionDroplet(link, changed) {
    if (!positioned) droplet.style.transition = 'none';
    droplet.style.left = `${link.offsetLeft}px`;
    droplet.style.top = `${link.offsetTop}px`;
    droplet.style.width = `${link.offsetWidth}px`;
    droplet.style.height = `${link.offsetHeight}px`;
    if (!positioned) {
      positioned = true;
      requestAnimationFrame(() => {
        droplet.classList.add('ready');
        droplet.style.removeProperty('transition');
      });
    } else if (changed && !reducedMotion.matches) {
      droplet.classList.remove('splash');
      void droplet.offsetWidth;
      droplet.classList.add('splash');
    }
  }

  function updateActive() {
    pending = false;
    const line = scrollY + Math.max(125, Math.min(innerHeight * .25, 260));
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 8;
    let current = sections[0].link;
    for (const section of sections) {
      if (section.element.getBoundingClientRect().top + scrollY <= line) current = section.link;
    }
    if (atBottom) current = sections[sections.length - 1].link;
    const changed = current !== activeLink;
    if (changed) {
      activeLink = current;
      for (const { link } of sections) {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    const connectIsActive = current === dockLink;
    if (changed && heroLink) {
      heroLink.classList.toggle('connect-active', connectIsActive);
      if (connectIsActive) heroLink.setAttribute('aria-current', 'location');
      else heroLink.removeAttribute('aria-current');
      heroLink.classList.remove('connect-arrival');
      if (connectIsActive && !reducedMotion.matches) {
        void heroLink.offsetWidth;
        heroLink.classList.add('connect-arrival');
      }
    }
    if (connectIsActive) {
      droplet.classList.remove('splash');
      droplet.style.opacity = '0';
    } else {
      droplet.style.removeProperty('opacity');
      positionDroplet(current, changed);
    }
    if (changed && !compactLayout.matches && nav.scrollWidth > nav.clientWidth + 2) {
      const navBox = nav.getBoundingClientRect();
      const linkBox = current.getBoundingClientRect();
      nav.scrollTo({ left: nav.scrollLeft + linkBox.left + linkBox.width / 2 - navBox.left - navBox.width / 2, behavior: 'smooth' });
    }
  }
  function scheduleUpdate() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(updateActive);
    }
  }
  addEventListener('scroll', () => { updateFloatingConnect(); scheduleUpdate(); }, { passive: true });
  nav.addEventListener('scroll', () => { renderFloatingConnect(connectProgress); scheduleUpdate(); }, { passive: true });
  addEventListener('resize', () => { renderFloatingConnect(connectProgress); scheduleUpdate(); }, { passive: true });
  addEventListener('load', () => { renderFloatingConnect(connectProgress); scheduleUpdate(); }, { once: true });
  renderFloatingConnect(connectProgress);
  updateActive();
})();
