/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Main Entry Point
   ═══════════════════════════════════════════════════════════ */

import './styles/global.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/responsive.css';

import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';

// import { initBrain3D } from './brain3d.js'; // Dynamically imported for performance
import { initParticles } from './particles.js';
import { initChat } from './chat.js';
import { initAnimations } from './animations.js';
import { initArchitecture } from './architecture.js';
import { initSystemMap } from './systemmap.js';
import { initNetworkGlobe } from './networkglobe.js';
import { initNavigation } from './navigation.js';
import { initAGISearch } from './agisearch.js';
import { initBlog } from './blog.js';
import './styles/blog.css';

// Initialize Vercel Monitoring
injectSpeedInsights();
inject();

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Core systems
  initNavigation();
  initAnimations();
  initChat();
  initAGISearch();

  // Visual systems  
  initParticles();
  import('./brain3d.js').then(({ initBrain3D }) => {
    initBrain3D();
  }).catch(err => console.error('Error loading 3D brain:', err));
  initArchitecture();
  initSystemMap();
  initNetworkGlobe();
  initBlog();

  // ── Waitlist Form Handler (inline onsubmit हटाया — CSP fix) ──
  const waitlistForm = document.getElementById('waitlist-form');
  const waitlistBtn = document.getElementById('waitlist-btn');
  if (waitlistForm && waitlistBtn) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      waitlistBtn.textContent = '✓ Joined!';
      waitlistBtn.disabled = true;
    });
  }
});
