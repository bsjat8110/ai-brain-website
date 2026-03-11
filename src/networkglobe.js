/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Network Globe Canvas
   ═══════════════════════════════════════════════════════════ */

export function initNetworkGlobe() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let time = 0;
  let dpr = Math.min(window.devicePixelRatio, 2);

  const GLOBE_NODES = 80;
  const globeNodes = [];

  for (let i = 0; i < GLOBE_NODES; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    globeNodes.push({
      phi,
      theta,
      r: 0.35 + Math.random() * 0.05,
      size: 1 + Math.random() * 2,
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function project(phi, theta, r, rotY) {
    const adjustedTheta = theta + rotY;
    const x = r * Math.sin(phi) * Math.cos(adjustedTheta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(adjustedTheta);
    return {
      x: w / 2 + x * Math.min(w, h),
      y: h / 2 - y * Math.min(w, h),
      z,
      visible: z > -0.1,
    };
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.003;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const globeR = Math.min(w, h) * 0.35;

    // Globe outline
    ctx.beginPath();
    ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, globeR);
    glow.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
    glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Project and draw nodes
    const projected = globeNodes.map(n => ({
      ...project(n.phi, n.theta, n.r, time),
      size: n.size,
    }));

    // Draw connections between close nodes (front-facing only)
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        if (!projected[i].visible || !projected[j].visible) continue;
        const dx = projected[i].x - projected[j].x;
        const dy = projected[i].y - projected[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const alpha = (1 - dist / 80) * 0.15 * Math.min(projected[i].z + 0.5, 1);
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    projected.forEach(p => {
      if (!p.visible) return;
      const alpha = Math.min((p.z + 0.3) * 1.5, 1) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.fill();
    });
  }
  animate();
}
