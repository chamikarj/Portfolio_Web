(() => {
  const section = document.querySelector('.about-journey');
  if (!section) return;
  const sticky = section.querySelector('.academic-sticky');
  const viewport = section.querySelector('.academic-window');
  const track = section.querySelector('.academic-track');
  const progress = section.querySelector('.academic-progress span');
  const cards = [...track.children];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1000px) and (min-height: 760px)');
  let pinned = false, distance = 0, frame = 0, visible = false, stops = [], measuredWidth = 0;
  const mobile = matchMedia('(max-width: 800px)');
  const fitPanel = () => {
    if (!mobile.matches) { viewport.style.height = ''; return; }
    const offset = viewport.scrollLeft;
    let active = 0;
    for (let i = 1; i < stops.length; i++) if (Math.abs(stops[i] - offset) < Math.abs(stops[active] - offset)) active = i;
    const height = Math.ceil(cards[active].getBoundingClientRect().height + 12);
    if (viewport.style.height !== `${height}px`) viewport.style.height = `${height}px`;
  };
  const topOffset = () => parseFloat(getComputedStyle(sticky).top) || 0;
  const position = () => pinned ? Math.min(distance, Math.max(0, topOffset() - section.getBoundingClientRect().top)) : viewport.scrollLeft;
  const paint = () => {
    frame = 0;
    const offset = position();
    if (pinned) track.style.transform = `translate3d(${-offset}px,0,0)`;
    progress.style.transform = `scaleX(${distance ? offset / distance : 0})`;
    section.querySelector('.academic-chapter span').classList.toggle('is-current', offset >= stops[1] - 100);
    fitPanel();
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
  const measure = () => {
    measuredWidth = viewport.clientWidth;
    pinned = desktop.matches && !motion.matches;
    section.classList.toggle('is-pinned', pinned);
    viewport.scrollLeft = 0;
    track.style.transform = '';
    distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const first = cards[0].offsetLeft;
    stops = cards.map(card => Math.min(distance, card.offsetLeft - first));
    section.style.height = pinned ? `${sticky.offsetHeight + distance}px` : '';
    section.querySelector('.academic-hint').textContent = pinned ? 'Scroll to explore' : 'Swipe to explore';
    paint();
  };
  const go = offset => {
    const behavior = motion.matches ? 'instant' : 'smooth';
    if (pinned) window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - topOffset() + offset, behavior });
    else {
      viewport.scrollTo({ left: offset, behavior });
      if (mobile.matches) window.scrollTo({ top: scrollY + viewport.getBoundingClientRect().top - document.querySelector('.header').offsetHeight - 14, behavior });
    }
  };
  const navigate = direction => {
    const offset = position();
    const next = direction > 0 ? stops.find(stop => stop > offset + 4) ?? distance : [...stops].reverse().find(stop => stop < offset - 4) ?? 0;
    go(next);
  };
  section.querySelector('.academic-prev').addEventListener('click', () => navigate(-1));
  section.querySelector('.academic-next').addEventListener('click', () => navigate(1));
  section.querySelector('.academic-jump').addEventListener('click', e => { e.preventDefault(); go(stops[1]); });
  viewport.addEventListener('keydown', e => { if (e.target === viewport && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); navigate(e.key === 'ArrowRight' ? 1 : -1); } });
  addEventListener('scroll', () => { if (pinned && visible) schedule(); }, { passive: true });
  viewport.addEventListener('scroll', schedule, { passive: true });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }).observe(section);
  new ResizeObserver(() => { if (Math.abs(viewport.clientWidth - measuredWidth) > 1) measure(); else fitPanel(); }).observe(viewport);
  const panelSizes = new ResizeObserver(fitPanel);
  cards.forEach(card => panelSizes.observe(card));
  desktop.addEventListener('change', measure); mobile.addEventListener('change', measure); motion.addEventListener('change', measure);
  const followHash = () => { if (location.hash === '#academic') requestAnimationFrame(() => go(stops[1])); };
  addEventListener('hashchange', followHash);
  measure(); followHash();
})();
