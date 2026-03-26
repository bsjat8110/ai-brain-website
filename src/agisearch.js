/* ═══════════════════════════════════════════════════════════
   AI BRAIN — AGI Search Terminal Simulation
   ═══════════════════════════════════════════════════════════ */

/**
 * Initializes the AGI Search Terminal on the landing page.
 * Provides a simulated "cognitive boot" sequence before opening the chat.
 */

/** Phase 5: Fix 3 — Local escapeHtml to prevent XSS from user query in log terminal */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function initAGISearch() {
  const searchInput = document.getElementById('agi-search-input');
  const searchBtn = document.getElementById('agi-search-btn');
  const outputLog = document.getElementById('agi-simulation-output');

  if (!searchInput || !searchBtn || !outputLog) return;

  const executeSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // UI Feedback: Disable input/btn
    searchInput.disabled = true;
    searchBtn.disabled = true;
    searchBtn.innerHTML = 'Processing...';

    // Show Terminal
    outputLog.classList.remove('hidden');
    outputLog.innerHTML = ''; // Clear previous

    const logs = [
      { text: 'Initializing neural handshake...', type: 'primary' },
      { text: 'Connecting to Global Knowledge Graph (2.4B nodes)...', type: 'secondary' },
      /** Phase 5: Fix 3 — Escape query before embedding in log text to prevent XSS */
      { text: 'Parsing query intent: "' + escapeHtml(query) + '"', type: 'primary' },
      { text: 'Cross-referencing persistent memory buffers...', type: 'secondary' },
      { text: 'Optimizing cognitive routing via Gemini 1.5 Pro...', type: 'primary' },
      { text: 'Brain synthesis complete. Establishing secure tunnel...', type: 'success' }
    ];

    for (const log of logs) {
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry = document.createElement('div');
      entry.className = `log-entry ${log.type}`;
      /** Phase 5: Fix 3 — Use textContent for log text to prevent XSS via innerHTML */
      const timestampSpan = document.createElement('span');
      timestampSpan.className = 'log-timestamp';
      timestampSpan.textContent = `[${timestamp}]`;
      const logTextSpan = document.createElement('span');
      logTextSpan.className = 'log-text';
      logTextSpan.textContent = log.text;
      entry.appendChild(timestampSpan);
      entry.appendChild(logTextSpan);
      outputLog.appendChild(entry);
      
      // Auto-scroll
      outputLog.scrollTop = outputLog.scrollHeight;
      
      // Random delay for "realism"
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    }

    // Final Success State
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reset UI for next time (hiddenly)
    setTimeout(() => {
        searchInput.disabled = false;
        searchBtn.disabled = false;
        searchBtn.innerHTML = 'Execute <span class="agi-sparkle">✨</span>';
        searchInput.value = '';
        outputLog.classList.add('hidden');
    }, 1000);

    // Trigger Chat Modal with the query
    const chatModal = document.getElementById('chat-modal');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    if (chatModal) {
      chatModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      if (chatInput) {
        chatInput.value = query;
        // Optionally auto-trigger send after a small delay
        setTimeout(() => {
           if (sendBtn) sendBtn.click();
        }, 500);
      }
    }
  };

  searchBtn.addEventListener('click', executeSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
  });
}
