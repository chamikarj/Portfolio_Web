(() => {
  const audio = document.getElementById('background-music');
  const button = document.getElementById('music-toggle');
  const slider = document.getElementById('music-volume');
  const output = document.getElementById('music-volume-value');
  if (!audio || !button || !slider || !output) return;
  const control = button.closest('.music-control');
  const openPanel = () => control.classList.add('is-open');
  const closePanel = () => control.classList.remove('is-open');
  control.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') openPanel(); });
  control.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') openPanel(); });
  control.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') closePanel(); });
  control.addEventListener('focusin', () => { if (control.querySelector(':focus-visible')) openPanel(); });
  control.addEventListener('focusout', event => { if (!control.contains(event.relatedTarget)) closePanel(); });
  document.addEventListener('scroll', closePanel, { passive: true, capture: true });
  document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) closePanel(); }, { passive: true });
  let enabled = true, waitingForGesture = true, lastVolume = 0.12;
  audio.volume = lastVolume;
  const sync = () => {
    const playing = enabled && !audio.paused && audio.volume > 0;
    button.setAttribute('aria-pressed', String(playing));
    button.style.setProperty('--music-level', `${playing ? audio.volume * 100 : 0}%`);
    const label = playing ? 'Mute background music' : 'Unmute background music';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.querySelector('.music-label').textContent = playing ? 'Sound on' : 'Sound off';
    slider.value = String(Math.round(audio.volume * 100));
    output.value = `${slider.value}%`;
  };
  const stopWaiting = () => {
    waitingForGesture = false;
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('keydown', firstGesture, true);
  };
  const play = async () => {
    if (!enabled || document.hidden) return;
    try {
      await audio.play();
      if (!enabled) audio.pause();
      else stopWaiting();
    } catch { /* A browser may require a user gesture before playing sound. */ }
    sync();
  };
  function firstGesture(event) {
    if (!waitingForGesture || !enabled || event.target.closest('.music-control')) return;
    if (event.type === 'keydown' && (event.ctrlKey || event.altKey || event.metaKey)) return;
    void play();
  }
  button.addEventListener('click', () => {
    openPanel();
    stopWaiting();
    if (!audio.paused && audio.volume > 0) {
      enabled = false;
      audio.pause();
      sync();
    } else {
      enabled = true;
      if (audio.volume === 0) audio.volume = lastVolume;
      void play();
    }
  });
  slider.addEventListener('input', () => {
    audio.volume = Number(slider.value) / 100;
    if (audio.volume > 0) {
      lastVolume = audio.volume;
      enabled = true;
      stopWaiting();
      if (audio.paused) void play();
    }
    sync();
  });
  button.addEventListener('wheel', event => {
    if (event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    const step = Math.min(6, Math.max(2, Math.round(Math.abs(event.deltaY) / 40) * 2));
    const percent = Math.max(0, Math.min(100, Math.round(audio.volume * 100) - Math.sign(event.deltaY) * step));
    audio.volume = percent / 100;
    if (percent > 0) {
      lastVolume = audio.volume;
      enabled = true;
      if (audio.paused) void play();
    }
    openPanel();
    sync();
  }, { passive: false });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (enabled) void play();
    sync();
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('volumechange', sync);
  audio.addEventListener('error', sync);
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);
  sync();
  void play();
})();
