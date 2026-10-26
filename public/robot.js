(() => {
  const panel = document.getElementById('robot-terminal');
  const message = document.getElementById('robot-message');
  const prompt = panel?.querySelector('.console-prompt');
  const stage = panel?.querySelector('.robot-stage');
  if (!panel || !message || !prompt || !stage) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let x = 0, y = 0;
  const paint = () => {
    frame = 0;
    panel.style.setProperty('--robot-x', `${x * 12}px`);
    panel.style.setProperty('--robot-y', `${y * 8}px`);
    panel.style.setProperty('--robot-turn', `${x * 7}deg`);
  };
  panel.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const box = panel.getBoundingClientRect();
    x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  const resetPose = () => { x = 0; y = 0; paint(); };
  panel.addEventListener('pointerleave', resetPose);
  reduced.addEventListener('change', resetPose);
  for (const tile of panel.querySelectorAll('[data-robot-message]')) {
    const show = () => {
      message.textContent = tile.dataset.robotMessage;
      prompt.textContent = `> ${tile.dataset.robotCommand}`;
      panel.classList.add('is-reacting');
    };
    const reset = () => {
      message.textContent = 'Making tech work for people.';
      prompt.textContent = '> hello';
      panel.classList.remove('is-reacting');
    };
    tile.addEventListener('pointerenter', show);
    tile.addEventListener('focus', show);
    tile.addEventListener('pointerleave', reset);
    tile.addEventListener('blur', reset);
  }
})();
