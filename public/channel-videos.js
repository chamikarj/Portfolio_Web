(() => {
  const panel = document.querySelector('.channel-card');
  const list = document.getElementById('channel-videos');
  const status = document.getElementById('channel-feed-status');
  const player = document.getElementById('channel-player');
  if (!panel || !list || !status || !player) return;

  let selectedId = player.dataset.videoId;
  let manualSelection = false;
  let resolvedLatest = false;
  let hasFreshVideos = false;
  let signature = '';
  let inView = !('IntersectionObserver' in window);
  let pending = false;
  let timer = 0;
  const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  function markSelection() {
    for (const link of list.querySelectorAll('.channel-video')) {
      const selected = link.dataset.videoId === selectedId;
      link.classList.toggle('is-selected', selected);
      if (selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }

  function selectVideo(video, autoplay = false) {
    selectedId = video.id;
    player.hidden = false;
    player.parentElement.querySelector('.channel-player-empty')?.remove();
    player.title = video.title + ' — Chamika rj';
    if (player.dataset.videoId !== video.id || autoplay) {
      player.src = `https://www.youtube.com/embed/${video.id}?rel=0${autoplay ? '&autoplay=1' : ''}`;
      player.dataset.videoId = video.id;
    }
    markSelection();
  }

  function validVideo(video) {
    if (!video || typeof video.id !== 'string' || !/^[\w-]{11}$/.test(video.id) || typeof video.title !== 'string' ||
        !video.title || video.title.length > 1000 || typeof video.published !== 'string' || !Number.isFinite(Date.parse(video.published))) return false;
    try {
      const url = new URL(video.thumbnail);
      return url.protocol === 'https:' && /^i\d?\.ytimg\.com$/.test(url.hostname) && url.pathname.startsWith(`/vi/${video.id}/`);
    } catch { return false; }
  }

  function renderVideos(videos) {
    const nextSignature = JSON.stringify(videos);
    if (nextSignature === signature) return;
    signature = nextSignature;
    const existing = new Map([...list.querySelectorAll('.channel-video')].map(link => [link.dataset.videoId, link]));
    list.querySelector('.channel-empty')?.remove();
    let cursor = list.firstElementChild;
    for (const video of videos) {
      let link = existing.get(video.id);
      if (!link) {
        link = document.createElement('a');
        link.className = 'channel-video';
        link.dataset.videoId = video.id;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const image = document.createElement('img');
        image.alt = '';
        image.width = 480;
        image.height = 360;
        image.loading = 'lazy';
        image.decoding = 'async';
        const caption = document.createElement('span');
        caption.className = 'channel-video-caption';
        const title = document.createElement('strong');
        title.className = 'channel-video-title';
        const time = document.createElement('time');
        caption.append(title, time);
        link.append(image, caption);
      }
      link.href = `https://www.youtube.com/watch?v=${video.id}`;
      link.dataset.videoTitle = video.title;
      link.setAttribute('aria-label', 'Play ' + video.title);
      link.querySelector('img').src = video.thumbnail;
      link.querySelector('.channel-video-title').textContent = video.title;
      const time = link.querySelector('time');
      time.dateTime = video.published;
      time.textContent = dateFormat.format(new Date(video.published));
      if (link !== cursor) list.insertBefore(link, cursor);
      cursor = link.nextElementSibling;
      existing.delete(video.id);
    }
    for (const link of existing.values()) link.remove();
    if (!videos.length) {
      const empty = document.createElement('p');
      empty.className = 'channel-empty';
      empty.textContent = 'No public videos yet.';
      list.append(empty);
      player.hidden = true;
      player.removeAttribute('src');
      player.dataset.videoId = '';
      selectedId = undefined;
      manualSelection = false;
      resolvedLatest = false;
      if (!player.parentElement.querySelector('.channel-player-empty')) {
        const message = empty.cloneNode(true);
        message.className = 'channel-player-empty';
        player.parentElement.append(message);
      }
    }
    markSelection();
  }

  list.addEventListener('click', event => {
    const link = event.target.closest('.channel-video');
    if (!link || !list.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    manualSelection = true;
    selectVideo({ id: link.dataset.videoId, title: link.dataset.videoTitle }, true);
  });

  function schedule() {
    clearTimeout(timer);
    if (inView && !document.hidden) timer = setTimeout(refresh, 60_000);
  }

  async function refresh() {
    if (pending || !inView || document.hidden) return;
    pending = true;
    list.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/youtube', { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error('Channel unavailable');
      const data = await response.json();
      if (!Array.isArray(data.videos) || data.videos.length > 15 || !data.videos.every(validVideo)) throw new Error('Invalid video list');
      if (!data.stale || !hasFreshVideos) renderVideos(data.videos);
      if (!data.stale) {
        hasFreshVideos = true;
        if (!resolvedLatest && !manualSelection && data.videos.length) selectVideo(data.videos[0]);
        resolvedLatest = data.videos.length > 0;
      }
      status.textContent = data.stale ? 'Showing saved videos. Updates will retry automatically.' : '';
    } catch {
      status.textContent = 'Videos could not refresh. Trying again shortly.';
    } finally {
      pending = false;
      list.setAttribute('aria-busy', 'false');
      schedule();
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) refresh();
      else clearTimeout(timer);
    }, { rootMargin: '100px' });
    observer.observe(panel);
  } else refresh();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
    else clearTimeout(timer);
  });
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', refresh);
  markSelection();
})();
