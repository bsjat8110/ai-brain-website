/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Background Particles (Performance Optimized)
   ═══════════════════════════════════════════════════════════ */

export function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const PARTICLE_COUNT = 60;
  const CONNECTION_DIST = 150;
  const CELL_SIZE = CONNECTION_DIST; // grid cell = max connection distance

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.3 + 0.1;
      const colors = ['0,212,255', '123,97,255', '0,255,163'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  // ─── Spatial Grid for O(n) connection checks ───
  function buildGrid() {
    const grid = new Map();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    }
    return grid;
  }

  function drawConnections() {
    const grid = buildGrid();
    const checked = new Set();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);

      // Only check this cell + 8 neighboring cells (3x3 grid)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${cx + dx},${cy + dy}`;
          const cell = grid.get(key);
          if (!cell) continue;

          for (const j of cell) {
            if (j <= i) continue; // avoid duplicate pairs
            const pairKey = `${i}-${j}`;
            if (checked.has(pairKey)) continue;
            checked.add(pairKey);

            const ddx = p.x - particles[j].x;
            const ddy = p.y - particles[j].y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < CONNECTION_DIST) {
              const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  // ─── Animation Loop with Page Visibility pause ───
  let animFrameId = null;
  let isPageVisible = !document.hidden;

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConnections();
  }

  function startLoop() {
    if (!animFrameId && isPageVisible) animate();
  }

  function stopLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) startLoop();
    else stopLoop();
  });

  startLoop();
}
