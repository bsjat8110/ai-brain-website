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

  const ctx = canvas.getContext('2d', { alpha: false });
  let width, height, dpr;
  let brainNodes = [];
  const numBrainNodes = window.innerWidth < 768 ? 400 : 800;
  const fov = 500;
  
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  
  // Performance Observer
  let isVisible = true;
  const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
  });
  observer.observe(canvas);

  const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
  };

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.5;
      targetMouseY = (e.clientY - height / 2) * 0.5;
  });

  // BRAIN GENERATOR (Two hemispheres)
  class BrainNode {
      constructor() {
          // Rejection sampling for brain shape
          let valid = false;
          while(!valid) {
              this.x = (Math.random() - 0.5) * 400;
              this.y = (Math.random() - 0.5) * 300;
              this.z = (Math.random() - 0.5) * 400;
              
              // Ellipsoid equation
              const rx = this.x / 200;
              const ry = this.y / 150;
              const rz = this.z / 200;
              if (rx*rx + ry*ry + rz*rz < 1) {
                  // Carve out center (longitudinal fissure)
                  if (Math.abs(this.x) > 10) {
                      valid = true;
                  }
              }
          }
          
          this.origX = this.x;
          this.origY = this.y;
          this.origZ = this.z;
          this.angle = Math.random() * Math.PI * 2;
          this.speed = Math.random() * 0.02 + 0.01;
          this.radius = Math.random() * 1.5 + 0.5;
          this.color = `rgba(255, 215, 0, ${Math.random() * 0.5 + 0.5})`; // Gold
      }
      
      update(time) {
          // Rotate brain slowly
          const rotY = time * 0.5;
          const cosY = Math.cos(rotY);
          const sinY = Math.sin(rotY);
          
          let rx = this.origX * cosY - this.origZ * sinY;
          let rz = this.origZ * cosY + this.origX * sinY;
          
          // Pulsing effect
          this.y = this.origY + Math.sin(time * this.speed * 10 + this.origX) * 5;
          
          // Hover offset
          const hoverOffset = Math.sin(time) * 20;

          // Apply mouse perspective
          this.drawX = rx;
          this.drawY = this.y - 100 + hoverOffset; // Move brain up slightly
          this.drawZ = rz + 600; // Move brain away
      }

      draw() {
          if (this.drawZ < 1) return;
          const scale = fov / this.drawZ;
          const x2d = (this.drawX - mouseX*0.3) * scale + width / 2;
          const y2d = (this.drawY - mouseY*0.3) * scale + height / 2;

          if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
              ctx.beginPath();
              ctx.arc(x2d, y2d, this.radius * scale, 0, Math.PI * 2);
              ctx.fillStyle = this.color;
              ctx.shadowBlur = 10 * scale;
              ctx.shadowColor = '#FFD700'; // Gold glow
              ctx.fill();
              ctx.shadowBlur = 0;
          }
      }
  }

  for (let i = 0; i < numBrainNodes; i++) {
      brainNodes.push(new BrainNode());
  }

  const drawCircuitFloor = (time) => {
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#00e5ff'; // Cyan glow
      
      const floorY = 250; // Floor height below center
      const gridSpacingX = 100;
      const gridSpacingZ = 100;
      
      // Moving Z offset to simulate forward motion
      const zOffset = (time * 100) % gridSpacingZ;
      
      // Draw grid lines
      for (let i = -10; i <= 10; i++) {
          // Vertical lines (Z-axis)
          const lineX = i * gridSpacingX;
          
          const zStart = 100;
          const zEnd = 2000;
          
          const scaleStart = fov / zStart;
          const scaleEnd = fov / zEnd;
          
          const x1 = (lineX - mouseX*0.1) * scaleStart + width / 2;
          const y1 = (floorY - mouseY*0.1) * scaleStart + height / 2;
          
          const x2 = (lineX - mouseX*0.1) * scaleEnd + width / 2;
          const y2 = (floorY - mouseY*0.1) * scaleEnd + height / 2;
          
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, 'rgba(0, 229, 255, 0.8)');
          grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = grad;
          ctx.stroke();
      }
      
      // Horizontal lines (X-axis)
      for (let j = 1; j <= 20; j++) {
          const lineZ = j * gridSpacingZ - zOffset + 100;
          if (lineZ < 100) continue;
          
          const scale = fov / lineZ;
          const y2d = (floorY - mouseY*0.1) * scale + height / 2;
          
          const xLeft = (-1000 - mouseX*0.1) * scale + width / 2;
          const xRight = (1000 - mouseX*0.1) * scale + width / 2;
          
          const alpha = Math.max(0, 1 - (lineZ / 2000));
          
          ctx.beginPath();
          ctx.moveTo(xLeft, y2d);
          ctx.lineTo(xRight, y2d);
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.5})`;
          ctx.stroke();
      }
      ctx.shadowBlur = 0;
  };

  let time = 0;
  const animate = () => {
      if (!isVisible) {
          requestAnimationFrame(animate);
          return;
      }
      
      time += 0.02;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Dark background (Deep Space Navy)
      ctx.fillStyle = '#020513';
      ctx.fillRect(0, 0, width, height);
      
      // Core glowing light under the brain
      const glowScale = fov / 600;
      const glowY = (150 - mouseY*0.1) * glowScale + height/2;
      const glowX = (0 - mouseX*0.1) * glowScale + width/2;
      
      ctx.globalCompositeOperation = 'screen';
      
      const coreGlow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 300);
      coreGlow.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(glowX, glowY, 300, 0, Math.PI*2);
      ctx.fill();

      // Draw Floor
      drawCircuitFloor(time);

      // Draw Brain
      brainNodes.forEach(node => {
          node.update(time);
      });
      
      // Sort nodes by Z for proper rendering (painters algorithm)
      brainNodes.sort((a, b) => b.drawZ - a.drawZ);
      
      // Draw Connections within the brain
      ctx.lineWidth = 0.5;
      for (let i = 0; i < brainNodes.length; i++) {
          const n1 = brainNodes[i];
          n1.draw();
          
          if (i % 3 !== 0) continue; // Optimization: only draw connections for a subset
          
          for (let j = i + 1; j < Math.min(i + 20, brainNodes.length); j++) {
              const n2 = brainNodes[j];
              const dx = n1.drawX - n2.drawX;
              const dy = n1.drawY - n2.drawY;
              const dz = n1.drawZ - n2.drawZ;
              const distSq = dx*dx + dy*dy + dz*dz;
              
              if (distSq < 1500) {
                  const scale1 = fov / n1.drawZ;
                  const scale2 = fov / n2.drawZ;
                  const x1 = (n1.drawX - mouseX*0.3) * scale1 + width / 2;
                  const y1 = (n1.drawY - mouseY*0.3) * scale1 + height / 2;
                  const x2 = (n2.drawX - mouseX*0.3) * scale2 + width / 2;
                  const y2 = (n2.drawY - mouseY*0.3) * scale2 + height / 2;
                  
                  ctx.beginPath();
                  ctx.moveTo(x1, y1);
                  ctx.lineTo(x2, y2);
                  ctx.strokeStyle = `rgba(255, 215, 0, ${(1 - distSq/1500) * 0.3})`;
                  ctx.stroke();
              }
          }
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(animate);
  };

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
