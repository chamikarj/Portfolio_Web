(() => {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('mesh-canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let points = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let previousX = null;
  let previousY = null;
  let dragX = 0;
  let dragY = 0;
  let active = false;
  let frameId = 0;
  let lastPaint = 0;
  let lastInput = 0;

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = Math.max(68, Math.min(96, width / 17));
    columns = Math.ceil(width / step) + 2;
    rows = Math.ceil(height / step) + 2;
    points = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = (col - .5) * step;
        const y = (row - .5) * step;
        points.push({ baseX: x, baseY: y, x, y, vx: 0, vy: 0, energy: 0 });
      }
    }
    start();
  }

  function line(a, b) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = .85;
    ctx.strokeStyle = 'rgba(126, 195, 239, .11)';
    ctx.beginPath();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const index = row * columns + col;
        if (col + 1 < columns) line(points[index], points[index + 1]);
        if (row + 1 < rows) line(points[index], points[index + columns]);
      }
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(167, 145, 237, .075)';
    ctx.beginPath();
    for (let row = 0; row + 1 < rows; row += 1) {
      for (let col = 0; col + 1 < columns; col += 1) {
        const index = row * columns + col;
        if ((row + col) % 2 === 0) line(points[index], points[index + columns + 1]);
        else line(points[index + 1], points[index + columns]);
      }
    }
    ctx.stroke();

    if (active) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(151, 234, 255, .28)';
      ctx.beginPath();
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          const index = row * columns + col;
          const point = points[index];
          if (col + 1 < columns && point.energy + points[index + 1].energy > .15) line(point, points[index + 1]);
          if (row + 1 < rows && point.energy + points[index + columns].energy > .15) line(point, points[index + columns]);
        }
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(154, 211, 248, .23)';
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
    if (active) {
      ctx.fillStyle = 'rgba(184, 244, 255, .66)';
      for (const point of points) {
        if (point.energy < .16) continue;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.3 + point.energy * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function animate(now) {
    if (now - lastPaint < 30) {
      frameId = requestAnimationFrame(animate);
      return;
    }
    lastPaint = now;
    let motion = 0;
    for (const point of points) {
      const dx = mouseX - point.baseX;
      const dy = mouseY - point.baseY;
      const distance = Math.hypot(dx, dy);
      const influence = active ? Math.max(0, 1 - distance / 235) ** 2 : 0;
      point.energy = influence;
      const targetX = influence * (dragX * .8 + dx * .1);
      const targetY = influence * (dragY * .8 + dy * .1);
      point.vx = (point.vx + (point.baseX + targetX - point.x) * .14) * .78;
      point.vy = (point.vy + (point.baseY + targetY - point.y) * .14) * .78;
      point.x += point.vx;
      point.y += point.vy;
      motion = Math.max(motion, Math.abs(point.vx), Math.abs(point.vy), Math.abs(point.baseX + targetX - point.x), Math.abs(point.baseY + targetY - point.y));
    }
    dragX *= .84;
    dragY *= .84;
    draw();
    frameId = motion > .035 || now - lastInput < 650 ? requestAnimationFrame(animate) : 0;
  }

  function start() {
    if (!frameId) frameId = requestAnimationFrame(animate);
  }

  addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (previousX !== null) {
      dragX = Math.max(-34, Math.min(34, event.clientX - previousX));
      dragY = Math.max(-34, Math.min(34, event.clientY - previousY));
    }
    mouseX = previousX = event.clientX;
    mouseY = previousY = event.clientY;
    active = true;
    lastInput = performance.now();
    start();
  }, { passive: true });

  function leave() {
    active = false;
    previousX = previousY = null;
    dragX = dragY = 0;
    lastInput = performance.now();
    start();
  }

  addEventListener('resize', resize, { passive: true });
  document.addEventListener('mouseleave', leave);
  addEventListener('blur', leave);
  resize();
})();
