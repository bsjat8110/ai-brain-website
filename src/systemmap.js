/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Interactive System Map (Canvas)
   ═══════════════════════════════════════════════════════════ */

export function initSystemMap() {
  const canvas = document.getElementById('systemmap-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let time = 0;
  let dpr = Math.min(window.devicePixelRatio, 2);
  let mouseX = -1, mouseY = -1;

  const nodes = [
    { label: 'Memory System', icon: '💾', x: 0.5, y: 0.15, color: '#00d4ff', r: 0 },
    { label: 'Agent Network', icon: '🤖', x: 0.15, y: 0.45, color: '#7b61ff', r: 0 },
    { label: 'Knowledge Graph', icon: '🔗', x: 0.85, y: 0.45, color: '#00ffa3', r: 0 },
    { label: 'Execution System', icon: '⚡', x: 0.3, y: 0.8, color: '#ff6b35', r: 0 },
    { label: 'Learning Core', icon: '📈', x: 0.7, y: 0.8, color: '#ff3d8e', r: 0 },
    { label: 'AI Brain', icon: '🧠', x: 0.5, y: 0.5, color: '#00d4ff', r: 0 },
  ];

  const links = [
    [5, 0], [5, 1], [5, 2], [5, 3], [5, 4],
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 4],
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

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
  });

  function drawLink(n1, n2) {
    const x1 = n1.x * w;
    const y1 = n1.y * h;
    const x2 = n2.x * w;
    const y2 = n2.y * h;

    // Animated dash
    ctx.beginPath();
    ctx.setLineDash([4, 8]);
    ctx.lineDashOffset = -time * 50;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Flowing particle
    const progress = (time * 0.3 + (n1.x + n2.y) * 2) % 1;
    const px = x1 + (x2 - x1) * progress;
    const py = y1 + (y2 - y1) * progress;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.fill();
  }

  function drawNode(node) {
    const x = node.x * w;
    const y = node.y * h;
    const isCenter = node.icon === '🧠';
    const baseR = isCenter ? Math.min(w, h) * 0.08 : Math.min(w, h) * 0.055;

    // Check hover
    const dx = mouseX - x;
    const dy = mouseY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isHovered = dist < baseR;

    // Smooth radius
    const targetR = isHovered ? baseR * 1.15 : baseR;
    node.r += (targetR - node.r) * 0.1;
    const r = node.r || baseR;

    // Outer glow
    const glowR = r * (isCenter ? 3 : 2.5);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, node.color + (isHovered ? '25' : '15'));
    glow.addColorStop(1, node.color + '00');
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Pulse ring
    const pulseR = r + 10 + Math.sin(time * 2) * 5;
    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = node.color + '15';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Node
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
    ctx.fill();
    ctx.strokeStyle = node.color + (isHovered ? '80' : '40');
    ctx.lineWidth = isCenter ? 2 : 1.5;
    ctx.stroke();

    // Icon
    ctx.font = `${r * 0.65}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.icon, x, y);

    // Label
    ctx.font = `500 ${Math.max(10, Math.min(12, w * 0.011))}px Inter, sans-serif`;
    ctx.fillStyle = isHovered ? '#ffffff' : '#8892a8';
    ctx.fillText(node.label, x, y + r + 18);
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.008;
    ctx.clearRect(0, 0, w, h);

    links.forEach(([i, j]) => drawLink(nodes[i], nodes[j]));
    nodes.forEach(drawNode);
  }
  animate();
}
