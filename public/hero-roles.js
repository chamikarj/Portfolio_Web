(() => {
  const label = document.getElementById('hero-roles');
  if (!label) return;

  const fullLabel = label.textContent.trim();
  const roles = fullLabel.split(' · ').map(role => role.trim()).filter(Boolean);
  if (!roles.length) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const accessible = document.createElement('span');
  accessible.className = 'hero-roles-a11y';
  accessible.textContent = roles.join(', ');
  const visual = document.createElement('span');
  visual.className = 'hero-roles-visual';
  visual.setAttribute('aria-hidden', 'true');
  const typed = document.createElement('span');
  visual.append(typed);

  let timer;
  let roleIndex = 0;
  let length = 0;
  let deleting = false;

  const tick = () => {
    const role = roles[roleIndex];
    typed.textContent = role.slice(0, length);
    if (!deleting && length < role.length) {
      length += 1;
      timer = setTimeout(tick, 85);
    } else if (!deleting) {
      deleting = true;
      timer = setTimeout(tick, 1100);
    } else if (length > 0) {
      length -= 1;
      timer = setTimeout(tick, 45);
    } else {
      roleIndex = (roleIndex + 1) % roles.length;
      deleting = false;
      timer = setTimeout(tick, 260);
    }
  };

  const start = () => {
    clearTimeout(timer);
    roleIndex = 0;
    length = 0;
    deleting = false;
    label.replaceChildren(accessible, visual);
    tick();
  };
  const stop = () => {
    clearTimeout(timer);
    label.textContent = fullLabel;
  };

  if (!reducedMotion.matches) start();
  reducedMotion.addEventListener('change', event => event.matches ? stop() : start());
})();
