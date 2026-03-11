/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Architecture Diagram (Canvas)
   ═══════════════════════════════════════════════════════════ */

export function initArchitecture() {
  const canvas = document.getElementById('architecture-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let time = 0;
  let dpr = Math.min(window.devicePixelRatio, 2);

  const components = [
    { id: 'engine', label: 'AI Brain Engine', icon: '🧠', x: 0.5, y: 0.18, color: '#00d4ff' },
    { id: 'memory', label: 'Persistent Memory', icon: '💾', x: 0.2, y: 0.45, color: '#7b61ff' },
    { id: 'knowledge', label: 'Knowledge Graph', icon: '🔗', x: 0.8, y: 0.45, color: '#00ffa3' },
    { id: 'agents', label: 'Agent Network', icon: '🤖', x: 0.2, y: 0.75, color: '#ff6b35' },
    { id: 'execution', label: 'Execution Engine', icon: '⚡', x: 0.8, y: 0.75, color: '#ff3d8e' },
    { id: 'learning', label: 'Learning Loop', icon: '📈', x: 0.5, y: 0.92, color: '#00d4ff' },
  ];

  const connections = [
    [0, 1], [0, 2], [1, 3], [2, 4], [1, 2], [3, 5], [4, 5], [3, 4], [0, 5],
  ];

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

  function drawConnection(from, to, progress) {
    const x1 = from.x * w;
    const y1 = from.y * h;
    const x2 = to.x * w;
    const y2 = to.y * h;

    // Static line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Animated glow
    const px = x1 + (x2 - x1) * progress;
    const py = y1 + (y2 - y1) * progress;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 12);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawNode(comp) {
    const x = comp.x * w;
    const y = comp.y * h;
    const nodeR = Math.min(w, h) * 0.06;

    // Glow
    const glowSize = nodeR * 2.5;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    glow.addColorStop(0, comp.color + '20');
    glow.addColorStop(1, comp.color + '00');
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Node background
    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
    ctx.fill();
    ctx.strokeStyle = comp.color + '60';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon
    ctx.font = `${nodeR * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(comp.icon, x, y);

    // Label
    ctx.font = `500 ${Math.max(11, Math.min(13, w * 0.012))}px Inter, sans-serif`;
    ctx.fillStyle = '#e8ecf4';
    ctx.textAlign = 'center';
    ctx.fillText(comp.label, x, y + nodeR + 16);
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.008;

    ctx.clearRect(0, 0, w, h);

    // Draw connections
    connections.forEach(([i, j], idx) => {
      const progress = (time * 0.5 + idx * 0.15) % 1;
      drawConnection(components[i], components[j], progress);
    });

    // Draw nodes
    components.forEach(drawNode);
  }
  animate();
}
