(() => {
  const root = document.documentElement;
  const key = 'chamika-rj-theme';
  let theme = 'dark';
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch { /* The toggle also works when browser storage is unavailable. */ }
  root.dataset.theme = theme;
  const update = () => {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const light = root.dataset.theme === 'light';
    button.setAttribute('aria-pressed', String(light));
    button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    button.title = light ? 'Switch to dark theme' : 'Switch to light theme';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f4f7fc' : '#0b1020');
  };
  const init = () => {
    update();
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(key, root.dataset.theme); } catch {}
      update();
      window.dispatchEvent(new CustomEvent('themechange', { detail: root.dataset.theme }));
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
