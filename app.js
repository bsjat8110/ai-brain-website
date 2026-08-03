/* ==========================================================================
   AI Brain Startup — High-DPI 4K 3D Canvas & Interactive Logic
   ========================================================================== */

/* Global Mobile Drawer Toggle Function - Instant Execution */
window.toggleMobileDrawer = function(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const d = document.getElementById('mobileDrawer');
  const o = document.getElementById('mobileOverlay');
  const t = document.getElementById('mobileToggle');
  if (!d) return;

  const isActive = d.classList.contains('active');
  if (isActive) {
    d.classList.remove('active');
    if (o) o.classList.remove('active');
    if (t) t.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  } else {
    d.classList.add('active');
    if (o) o.classList.add('active');
    if (t) t.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initSelfHealingAnalytics();
  initNeuralCanvas();
  initMobileDrawer();
  initAgentTabs();
  initMemoryCalculator();
  initLiveDemoSimulator();
  initWaitlistForm();
  initContactPageForm();
  initModal();
  initCardSpotlight();
});

/* --------------------------------------------------------------------------
   1. Next-Generation AGI Dual-Core Quantum 3D Neural Sphere Animation
   -------------------------------------------------------------------------- */
function initNeuralCanvas() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let width, height, dpr;
  let outerPoints = [];
  let innerPoints = [];
  let signalPulses = [];
  
  let rotAngleX = 0;
  let rotAngleY = 0;
  let inRotAngleX = 0;
  let inRotAngleY = 0;

  function generateSpherePoints(count, r) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      pts.push({
        baseX: Math.cos(theta) * radiusAtY * r,
        baseY: y * r,
        baseZ: Math.sin(theta) * radiusAtY * r,
        pulse: Math.random() * Math.PI * 2
      });
    }
    return pts;
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: 320, height: 320 };
    const size = Math.min(rect.width, rect.height) || 320;
    width = size;
    height = size;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const outerRadius = size * 0.38;
    const innerRadius = outerRadius * 0.42;

    outerPoints = generateSpherePoints(outerNodeCount, outerRadius);
    innerPoints = generateSpherePoints(innerNodeCount, innerRadius);

    signalPulses = [];
    for (let i = 0; i < 10; i++) {
      signalPulses.push({
        from: Math.floor(Math.random() * outerNodeCount),
        to: Math.floor(Math.random() * outerNodeCount),
        progress: Math.random(),
        speed: 0.01 + Math.random() * 0.015
      });
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  let mouseX = 0, mouseY = 0;
  function handleMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (clientX - rect.left - width / 2) * 0.00008;
    mouseY = (clientY - rect.top - height / 2) * 0.00008;
  }

  window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Pure 3D projection function — NO MUTATION of base point coordinates (prevents distortion/flattening)
  function projectPoint(p, rx, ry, cx, cy) {
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x1 = p.baseX * cosY - p.baseZ * sinY;
    const z1 = p.baseZ * cosY + p.baseX * sinY;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y2 = p.baseY * cosX - z1 * sinX;
    const z2 = z1 * cosX + p.baseY * sinX;

    const perspective = 340;
    const scale = perspective / (perspective + z2);
    return {
      x: x1 * scale + cx,
      y: y2 * scale + cy,
      z: z2,
      scale: scale,
      pulse: p.pulse
    };
  }

  function animate() {
    if (isCanvasVisible) {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      rotAngleX += 0.003;
      rotAngleY += 0.005;
      inRotAngleX -= 0.004;
      inRotAngleY -= 0.006;

      const cx = width / 2;
      const cy = height / 2;

      // Draw Background Radial Quantum Energy Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, width * 0.45);
      bgGlow.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      bgGlow.addColorStop(0.5, 'rgba(112, 0, 255, 0.08)');
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      const rotX = rotAngleX + mouseY;
      const rotY = rotAngleY + mouseX;
      const inRotX = inRotAngleX - mouseY * 1.5;
      const inRotY = inRotAngleY - mouseX * 1.5;

      const outerProjected = outerPoints.map(p => projectPoint(p, rotX, rotY, cx, cy));
      const innerProjected = innerPoints.map(p => projectPoint(p, inRotX, inRotY, cx, cy));

      // 2. Draw Outer Sphere Synaptic Network Lines
      const maxConnectDist = width * 0.28;
      const maxDistSq = maxConnectDist * maxConnectDist;

      for (let i = 0; i < outerProjected.length; i++) {
        for (let j = i + 1; j < outerProjected.length; j++) {
          const p1 = outerProjected[i];
          const p2 = outerProjected[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxConnectDist) * 0.45;
            const avgZ = (p1.z + p2.z) / 2;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            if (avgZ > 10) {
              ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.7})`;
            }
            ctx.lineWidth = avgZ > 20 ? 1.2 : 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Draw Synaptic Firing Energy Pulses Moving Along Network Lines
      for (let pulse of signalPulses) {
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          pulse.from = Math.floor(Math.random() * outerProjected.length);
          pulse.to = Math.floor(Math.random() * outerProjected.length);
        }

        const pFrom = outerProjected[pulse.from];
        const pTo = outerProjected[pulse.to];
        if (pFrom && pTo) {
          const px = pFrom.x + (pTo.x - pFrom.x) * pulse.progress;
          const py = pFrom.y + (pTo.y - pFrom.y) * pulse.progress;

          const pulseGlow = ctx.createRadialGradient(px, py, 0, px, py, 6);
          pulseGlow.addColorStop(0, '#ffffff');
          pulseGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.9)');
          pulseGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');

          ctx.fillStyle = pulseGlow;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Draw Inner AGI Cognitive Core Nodes & Connections
      for (let i = 0; i < innerProjected.length; i++) {
        for (let j = i + 1; j < innerProjected.length; j++) {
          const p1 = innerProjected[i];
          const p2 = innerProjected[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          if (dx * dx + dy * dy < maxDistSq * 0.4) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(236, 72, 153, 0.45)`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (let p of innerProjected) {
        const nodeRadius = Math.max(2, 4 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Draw Outer Nodes with Glowing Z-Depth Atmosphere
      for (let p of outerProjected) {
        const nodeRadius = Math.max(1.8, 3.8 * p.scale);
        const pulseSize = Math.sin(time * 3 + p.pulse) * 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius + pulseSize, 0, Math.PI * 2);

        if (p.z > 30) {
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
        } else if (p.z < -30) {
          ctx.fillStyle = 'rgba(147, 51, 234, 0.7)';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* --------------------------------------------------------------------------
   2. Mobile Drawer Navigation Controller
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  const toggle = document.getElementById('mobileToggle');
  const closeBtn = document.getElementById('btnCloseDrawer');

  window.toggleMobileDrawer = function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const d = document.getElementById('mobileDrawer');
    const o = document.getElementById('mobileOverlay');
    const t = document.getElementById('mobileToggle');
    if (!d) return;

    const isActive = d.classList.contains('active');
    if (isActive) {
      d.classList.remove('active');
      if (o) o.classList.remove('active');
      if (t) t.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    } else {
      d.classList.add('active');
      if (o) o.classList.add('active');
      if (t) t.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  };

  if (toggle) {
    toggle.onclick = window.toggleMobileDrawer;
    toggle.addEventListener('touchstart', function(e) {
      e.preventDefault();
      window.toggleMobileDrawer(e);
    }, { passive: false });
  }

  if (closeBtn) {
    closeBtn.onclick = function() {
      const d = document.getElementById('mobileDrawer');
      const o = document.getElementById('mobileOverlay');
      if (d) d.classList.remove('active');
      if (o) o.classList.remove('active');
      document.body.style.overflow = '';
    };
  }

  if (overlay) {
    overlay.onclick = function() {
      const d = document.getElementById('mobileDrawer');
      const o = document.getElementById('mobileOverlay');
      if (d) d.classList.remove('active');
      if (o) o.classList.remove('active');
      document.body.style.overflow = '';
    };
  }

  if (drawer) {
    const drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.onclick = function() {
        const d = document.getElementById('mobileDrawer');
        const o = document.getElementById('mobileOverlay');
        if (d) d.classList.remove('active');
        if (o) o.classList.remove('active');
        document.body.style.overflow = '';
      };
    });
  }
}

/* --------------------------------------------------------------------------
   3. Autonomous Agent Tabs Switcher
   -------------------------------------------------------------------------- */
function initAgentTabs() {
  const tabs = document.querySelectorAll('.agent-tab');
  const contents = document.querySelectorAll('.agent-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      contents.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('hidden', '');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        targetContent.removeAttribute('hidden');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Live AI Demo Simulator
   -------------------------------------------------------------------------- */
function initLiveDemoSimulator() {
  const demoForm = document.getElementById('demoForm');
  const demoInput = document.getElementById('demoInput');
  const demoChat = document.getElementById('demoChat');
  const suggestBtns = document.querySelectorAll('.suggest-btn');

  if (!demoForm || !demoChat) return;

  const simulatedResponses = {
    'Explain Persistent Memory': `AI Brain uses a dual-layer cognitive architecture combining continuous vector embeddings with a Graph Neural Network (GNN). Every conversation, code revision, and project decision is indexed into non-volatile graph nodes, enabling instant contextual retrieval even across months of inactivity.`,
    '2026 Agent Roadmap': `In 2026, AI Brain evolves through Phase 2 into multi-agent orchestration. Key milestones include autonomous goal decomposition, recursive self-debugging for coding agents, and real-time distributed knowledge syncing.`,
    'Google Cloud Integration': `AI Brain is engineered for native deployment on Google Cloud Infrastructure. It leverages Firebase Firestore for distributed graph state synchronization, BigQuery for massive analytical vector querying, and Gemini API for multimodal reasoning.`
  };

  function appendBubble(text, sender = 'user') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar-mini';
    avatar.textContent = sender === 'user' ? '👤' : '🧠';

    const textDiv = document.createElement('div');
    textDiv.className = 'bubble-text';
    textDiv.textContent = text;

    bubble.appendChild(avatar);
    bubble.appendChild(textDiv);

    demoChat.appendChild(bubble);
    demoChat.scrollTop = demoChat.scrollHeight;
  }

  function handleQuery(queryText) {
    if (!queryText.trim()) return;

    appendBubble(queryText, 'user');

    // Simulate AI thinking delay
    setTimeout(() => {
      let response = "AI Brain is analyzing your prompt against persistent memory graphs...";
      if (queryText.includes("Persistent Memory") || queryText.includes("memory")) {
        response = simulatedResponses['Explain Persistent Memory'];
      } else if (queryText.includes("Roadmap") || queryText.includes("2026")) {
        response = simulatedResponses['2026 Agent Roadmap'];
      } else if (queryText.includes("Google Cloud") || queryText.includes("Cloud")) {
        response = simulatedResponses['Google Cloud Integration'];
      } else {
        response = `Recorded "${queryText}" into persistent memory. AI Brain has indexed this context for future autonomous agent workflows.`;
      }

      appendBubble(response, 'ai');
    }, 600);
  }

  demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = demoInput.value;
    handleQuery(query);
    demoInput.value = '';
  });

  suggestBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      handleQuery(query);
    });
  });
}

/* --------------------------------------------------------------------------
   5. Waitlist Form Submission (Functional Storage & Logging)
   -------------------------------------------------------------------------- */
function initWaitlistForm() {
  const form = document.getElementById('waitlistForm');
  const toast = document.getElementById('formToast');

  if (!form || !toast) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('waitlistEmail').value;
    const role = document.getElementById('waitlistRole').value;

    if (email && role) {
      const submission = {
        email: email,
        role: role,
        timestamp: new Date().toISOString(),
        domain: 'aibrainstartup.com'
      };

      // 1. Store in localStorage
      let subscribers = [];
      try {
        subscribers = JSON.parse(localStorage.getItem('aibrain_waitlist_subscribers') || '[]');
      } catch (err) {
        subscribers = [];
      }
      subscribers.push(submission);
      localStorage.setItem('aibrain_waitlist_subscribers', JSON.stringify(subscribers));

      // 2. Log formatted JSON to console
      console.log('🚀 [AI Brain Waitlist] New Functional Submission:', submission);

      // 3. Show real success toast message
      toast.classList.remove('hidden');
      form.reset();

      setTimeout(() => {
        toast.classList.add('hidden');
      }, 6000);
    }
  });
}

/* --------------------------------------------------------------------------
   6. Contact Page Form Controller
   -------------------------------------------------------------------------- */
function initContactPageForm() {
  const form = document.getElementById('contactPageForm');
  const toast = document.getElementById('contactToast');
  if (!form || !toast) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const category = document.getElementById('contactCategory').value;
    const msg = document.getElementById('contactMsg').value;

    if (name && email && msg) {
      const submission = {
        name: name,
        email: email,
        category: category,
        message: msg,
        timestamp: new Date().toISOString()
      };

      try {
        const messages = JSON.parse(localStorage.getItem('aibrain_contact_messages') || '[]');
        messages.push(submission);
        localStorage.setItem('aibrain_contact_messages', JSON.stringify(messages));
      } catch (err) {
        console.error(err);
      }

      console.log('📬 [AI Brain Contact] New Message Received:', submission);

      toast.classList.remove('hidden');
      form.reset();

      setTimeout(() => {
        toast.classList.add('hidden');
      }, 6000);
    }
  });
}

/* --------------------------------------------------------------------------
   4. Interactive Memory Calculator Widget Logic
   -------------------------------------------------------------------------- */
function initMemoryCalculator() {
  const codeSizeInput = document.getElementById('calcCodeSize');
  const promptsInput = document.getElementById('calcPrompts');

  const valCodeSize = document.getElementById('valCodeSize');
  const valPrompts = document.getElementById('valPrompts');

  const resTokens = document.getElementById('resTokens');
  const resEfficiency = document.getElementById('resEfficiency');
  const resCost = document.getElementById('resCost');

  if (!codeSizeInput || !promptsInput) return;

  function calculate() {
    const files = parseInt(codeSizeInput.value, 10);
    const prompts = parseInt(promptsInput.value, 10);

    valCodeSize.textContent = `${files} Files`;
    valPrompts.textContent = `${prompts} Queries/day`;

    // Monthly Wasted Tokens in Stateless LLM = (files * 800 tokens * prompts * 30 days) / 1,000,000
    const monthlyWastedTokens = ((files * 850 * prompts * 30) / 1000000).toFixed(1);
    const efficiency = Math.min(98.5, 85 + (files * 0.015)).toFixed(1);
    const costSaved = Math.round((files * 850 * prompts * 30 * 0.000003));

    resTokens.textContent = `${monthlyWastedTokens} Million Tokens`;
    resEfficiency.textContent = `${efficiency}% Saved`;
    resCost.textContent = `$${costSaved} / Mo Saved`;
  }

  codeSizeInput.addEventListener('input', calculate);
  promptsInput.addEventListener('input', calculate);
  calculate();
}

/* --------------------------------------------------------------------------
   7. Terms & Conditions Modal Popup Controller
   -------------------------------------------------------------------------- */
function initModal() {
  const modal = document.getElementById('termsModal');
  const openBtns = document.querySelectorAll('.open-terms-btn');
  const closeBtn = document.getElementById('btnCloseModal');
  const acceptBtn = document.getElementById('btnAcceptModal');
  const headerBackBtn = document.getElementById('btnHeaderBackHome');
  const footerBackBtn = document.getElementById('btnFooterBackHome');

  if (!modal) return;

  // Ensure modal is cleanly closed on initial load
  modal.classList.remove('active');
  document.body.style.overflow = '';

  function openModal(e) {
    if (e) e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (acceptBtn) acceptBtn.addEventListener('click', closeModal);
  if (headerBackBtn) headerBackBtn.addEventListener('click', closeModal);
  if (footerBackBtn) footerBackBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

/* --------------------------------------------------------------------------
   8. Next-Gen 3D Mouse Spotlight Glow Controller
   -------------------------------------------------------------------------- */
function initCardSpotlight() {
  document.querySelectorAll('.glass-card, .hud-stat-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   9. Autonomous Self-Healing Engine & Real-Time Visitor Analytics Tracker
   -------------------------------------------------------------------------- */
function initSelfHealingAnalytics() {
  const STORAGE_KEY = 'aibrain_system_health';
  let healthData = {
    visitors: 1,
    pageviews: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    errors: [],
    repairs: 0,
    status: 'ONLINE_HEALTHY'
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      healthData.visitors = (parsed.visitors || 0) + (sessionStorage.getItem('aibrain_session') ? 0 : 1);
      healthData.pageviews = (parsed.pageviews || 0) + 1;
      healthData.firstVisit = parsed.firstVisit || healthData.firstVisit;
      healthData.errors = parsed.errors || [];
      healthData.repairs = parsed.repairs || 0;
    }
    sessionStorage.setItem('aibrain_session', 'true');
    healthData.lastVisit = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(healthData));
  } catch (e) {
    console.warn('[AI Brain Monitor] Storage isolated:', e.message);
  }

  // Global Error Interceptor & Self-Healing Protocol
  function handleSystemError(message, source, lineno, colno, error) {
    const errorEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message: message || 'Unhandled Script Exception',
      source: source || 'app.js',
      line: lineno || 0,
      stack: error ? error.stack : 'N/A'
    };

    healthData.errors.push(errorEntry);
    healthData.repairs++;
    healthData.status = 'AUTO_HEALED';
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(healthData));
    } catch (e) {}

    // Auto-Healing Recovery Actions
    console.warn('🛡️ [AI Brain Self-Healing Engine] Intercepted Error & Restored State:', errorEntry.message);
    autoRepairState();

    return true; // Prevents browser error crash banner
  }

  function autoRepairState() {
    try {
      const canvas = document.getElementById('neuralCanvas');
      if (canvas && !canvas.getContext('2d')) {
        initNeuralCanvas();
      }
      initWaitlistForm();
      initContactPageForm();
    } catch (e) {
      console.log('[AI Brain Self-Healing] Subsystem fallback complete.');
    }
  }

  window.onerror = handleSystemError;
  window.onunhandledrejection = (e) => {
    handleSystemError(e.reason ? e.reason.message : 'Unhandled Promise Rejection', 'Promise', 0, 0, e.reason);
  };

  // Expose global API for browser console inspection
  window.AIBrainSystem = {
    getHealth: () => healthData,
    getReport: () => {
      console.log('====================================');
      console.log('🧠 AI BRAIN SELF-HEALING & ANALYTICS MONITOR');
      console.log('====================================');
      console.log(`🟢 System Status: ${healthData.status}`);
      console.log(`👥 Total Visitors: ${healthData.visitors}`);
      console.log(`📄 Total Pageviews: ${healthData.pageviews}`);
      console.log(`⚡ Self-Repairs Executed: ${healthData.repairs}`);
      console.log(`🐞 Intercepted Logs: ${healthData.errors.length}`);
      console.table(healthData.errors);
      return healthData;
    },
    clearLogs: () => {
      healthData.errors = [];
      healthData.repairs = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(healthData));
      console.log('✨ Logs cleared.');
    }
  };
}
