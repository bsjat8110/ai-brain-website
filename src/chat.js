/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Chat System
   ═══════════════════════════════════════════════════════════ */

export function initChat() {
  const searchInput = document.getElementById('search-input');
  const chatModal = document.getElementById('chat-modal');
  const chatOverlay = document.getElementById('chat-overlay');
  const chatClose = document.getElementById('chat-close');
  const chatClear = document.getElementById('chat-clear');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const modelSelect = document.getElementById('model-select');

  if (!searchInput || !chatModal) return;

  let messages = [];

  // Predefined responses for demo
  const demoResponses = {
    default: [
      "AI Brain is designed to maintain persistent memory across all interactions. Unlike traditional AI, it remembers context, builds knowledge over time, and can act autonomously.",
      "Our architecture consists of several interconnected modules: the Persistent Memory Layer, Knowledge Graph, Autonomous Agent Network, Execution Engine, and Learning Loop — all working together to create continuous intelligence.",
      "The AI Brain research lab is currently focused on five core areas: Persistent AI Memory, Autonomous Agent Systems, Knowledge Graph Intelligence, Human-AI Cognitive Interfaces, and Continuous Learning Systems.",
      "AI Brain's autonomous agents can work independently on complex tasks. Each agent — Research, Coding, Strategy, Knowledge, and Automation — specializes in different domains while sharing information through the knowledge graph.",
      "Our roadmap spans from 2026 (Memory Architecture) through 2029+ (Global Intelligence Network). We're currently in the foundational research phase, building the core persistent memory systems.",
    ],
    architecture: "AI Brain's architecture is a modular system with 6 core components:\n\n1. **AI Brain Engine** — Central processing and reasoning core\n2. **Persistent Memory Layer** — Long-term storage with contextual retrieval\n3. **Knowledge Graph** — Dynamic relationship mapping\n4. **Autonomous Agent Network** — Multi-agent task execution\n5. **Execution Engine** — Workflow and task pipeline management\n6. **Learning Loop** — Continuous improvement and adaptation",
    memory: "The Persistent Memory Engine has 4 types:\n\n• **Conversation Memory** — Retains context across all conversations\n• **Idea Memory** — Stores and evolves creative insights\n• **Project Memory** — Tracks project states and decisions\n• **Knowledge Graph Memory** — Maps concept relationships\n\nThis allows AI Brain to build true understanding over time.",
    agents: "The Autonomous Agent Network includes 5 specialized agents:\n\n🔬 **Research Agent** — Information exploration and synthesis\n💻 **Coding Agent** — Code writing, debugging, and optimization\n🎯 **Strategy Agent** — Strategic planning and decision-making\n📚 **Knowledge Agent** — Knowledge graph management\n⚙️ **Automation Agent** — Workflow and task automation",
  };

  function openChat() {
    chatModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => chatInput.focus(), 300);
  }

  function closeChat() {
    chatModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function clearChat() {
    messages = [];
    chatMessages.innerHTML = `
      <div class="chat-modal__welcome">
        <span class="chat-modal__welcome-icon">🧠</span>
        <h3 class="chat-modal__welcome-title">Welcome to AI Brain</h3>
        <p class="chat-modal__welcome-text">Ask anything about AI Brain's architecture, research areas, or capabilities.</p>
      </div>
    `;
  }

  function addMessage(content, isUser = false) {
    // Remove welcome message
    const welcome = chatMessages.querySelector('.chat-modal__welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = `chat-message chat-message--${isUser ? 'user' : 'ai'}`;
    msg.innerHTML = `
      <div class="chat-message__avatar">${isUser ? '👤' : '🧠'}</div>
      <div class="chat-message__content">${formatMessage(content)}</div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatMessage(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function getResponse(query) {
    const q = query.toLowerCase();
    if (q.includes('architect')) return demoResponses.architecture;
    if (q.includes('memory') || q.includes('remember')) return demoResponses.memory;
    if (q.includes('agent')) return demoResponses.agents;
    return demoResponses.default[Math.floor(Math.random() * demoResponses.default.length)];
  }

  async function simulateStreaming(text) {
    const welcome = chatMessages.querySelector('.chat-modal__welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message--ai';
    msg.innerHTML = `
      <div class="chat-message__avatar">🧠</div>
      <div class="chat-message__content"></div>
    `;
    chatMessages.appendChild(msg);

    const contentEl = msg.querySelector('.chat-message__content');
    let displayed = '';

    for (let i = 0; i < text.length; i++) {
      displayed += text[i];
      contentEl.innerHTML = formatMessage(displayed);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      await new Promise(r => setTimeout(r, 8 + Math.random() * 15));
    }
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    addMessage(text, true);

    // Show typing indicator briefly
    await new Promise(r => setTimeout(r, 500));

    const response = getResponse(text);
    await simulateStreaming(response);
  }

  // Event listeners
  searchInput.addEventListener('click', openChat);
  chatOverlay.addEventListener('click', closeChat);
  chatClose.addEventListener('click', closeChat);
  chatClear.addEventListener('click', clearChat);
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // ⌘K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (chatModal.classList.contains('active')) {
        closeChat();
      } else {
        openChat();
      }
    }
    if (e.key === 'Escape' && chatModal.classList.contains('active')) {
      closeChat();
    }
  });
}
