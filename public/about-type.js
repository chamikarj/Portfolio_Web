(() => {
  const section = document.getElementById('about');
  const paragraphs = [...document.querySelectorAll('#about .about-copy')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const art = section?.querySelector('.about-art');
  if (art && !reducedMotion.matches) {
    art.classList.add('is-prepared');
    const image = art.querySelector('.about-art-main');
    const reveal = () => art.classList.add('is-visible');
    const revealWhenLoaded = () => {
      if (!image || image.complete) return reveal();
      image.addEventListener('load', reveal, { once: true });
      image.addEventListener('error', reveal, { once: true });
    };
    reducedMotion.addEventListener('change', event => {
      if (event.matches) reveal();
    });
    if ('IntersectionObserver' in window) {
      const artObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        artObserver.disconnect();
        revealWhenLoaded();
      }, { threshold: .15, rootMargin: '0px 0px -5% 0px' });
      artObserver.observe(art);
    } else {
      revealWhenLoaded();
    }
  }
  if (!section || !paragraphs.length || reducedMotion.matches) return;

  const characters = [];
  for (const paragraph of paragraphs) {
    const accessible = document.createElement('span');
    accessible.className = 'about-a11y';
    accessible.textContent = paragraph.textContent;

    const visual = document.createElement('span');
    visual.className = 'about-type-visual';
    visual.setAttribute('aria-hidden', 'true');
    while (paragraph.firstChild) visual.append(paragraph.firstChild);
    paragraph.append(accessible, visual);

    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.match(/\s+|\S+/gu) || []) {
        if (/^\s+$/u.test(part)) {
          fragment.append(document.createTextNode(part));
          continue;
        }
        const word = document.createElement('span');
        word.className = 'about-type-word';
        for (const letter of part) {
          const character = document.createElement('span');
          character.className = 'about-type-char';
          character.textContent = letter;
          word.append(character);
          characters.push(character);
        }
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
  }

  let started = false;
  let frameId = 0;
  let revealed = 0;
  const duration = Math.min(7200, Math.max(4500, characters.length * 12));

  function finish() {
    cancelAnimationFrame(frameId);
    while (revealed < characters.length) characters[revealed++].classList.add('is-revealed');
  }

  function start() {
    if (started) return;
    started = true;
    const began = performance.now();
    function tick(now) {
      const count = Math.min(characters.length, Math.floor((now - began) / duration * characters.length));
      while (revealed < count) characters[revealed++].classList.add('is-revealed');
      if (revealed < characters.length) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
  }

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) finish();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      start();
      observer.disconnect();
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
    observer.observe(paragraphs[0]);
  } else {
    start();
  }
})();
