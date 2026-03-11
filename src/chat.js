/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Chat System with Multi-Provider Support
   ═══════════════════════════════════════════════════════════ */

import { streamAIResponse } from './ai-router.js';

export function initChat() {
  const searchInput = document.getElementById('search-input');
  const chatModal = document.getElementById('chat-modal');
  const chatOverlay = document.getElementById('chat-overlay');
  const chatClose = document.getElementById('chat-close');
  const chatClear = document.getElementById('chat-clear');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');

  // Provider Settings Elements
  const settingsBtn = document.getElementById('chat-settings-btn');
  const settingsPanel = document.getElementById('provider-settings-panel');
  const settingsClose = document.getElementById('provider-settings-close');
  const providerTabs = document.querySelectorAll('.provider-tab');
  const modelPills = document.querySelectorAll('.model-pill');
  const apiKeyInput = document.getElementById('provider-api-key');
  const connectBtn = document.getElementById('provider-connect-btn');
  const customFields = document.getElementById('custom-fields');
  const customEndpointInput = document.getElementById('custom-endpoint');
  const customModelInput = document.getElementById('custom-model');
  const activeModelName = document.getElementById('active-model-name');

  if (!searchInput || !chatModal) return;

  // --- STATE MANAGEMENT ---
  let messages = [];
  let isStreaming = false;

  let state = {
    provider: localStorage.getItem('aiData_provider') || 'gemini',
    tier: localStorage.getItem('aiData_tier') || 'fast',
    keys: JSON.parse(localStorage.getItem('aiData_keys') || '{}'),
    custom: JSON.parse(localStorage.getItem('aiData_custom') || '{"endpoint":"","model":""}')
  };

  const providerDisplayNames = { gemini: 'Gemini', openai: 'GPT', claude: 'Claude', custom: 'Custom' };
  const tierDisplayNames = { fast: 'Fast', medium: 'Medium', pro: 'Pro' };

  function updateActiveModelIndicator() {
    if (state.provider === 'custom') {
      activeModelName.textContent = state.custom.model ? `Custom: ${state.custom.model}` : 'Custom API';
    } else {
      activeModelName.textContent = `${providerDisplayNames[state.provider]} ${tierDisplayNames[state.tier]}`;
    }
  }

  function syncUIToState() {
    providerTabs.forEach(t => t.classList.toggle('active', t.dataset.provider === state.provider));
    modelPills.forEach(p => p.classList.toggle('active', p.dataset.tier === state.tier));
    
    if (state.provider === 'custom') {
      customFields.classList.remove('hidden');
      customEndpointInput.value = state.custom.endpoint;
      customModelInput.value = state.custom.model;
    } else {
      customFields.classList.add('hidden');
    }
    
    apiKeyInput.value = state.keys[state.provider] || '';
    updateActiveModelIndicator();
  }

  function saveState() {
    localStorage.setItem('aiData_provider', state.provider);
    localStorage.setItem('aiData_tier', state.tier);
    localStorage.setItem('aiData_keys', JSON.stringify(state.keys));
    localStorage.setItem('aiData_custom', JSON.stringify(state.custom));
    updateActiveModelIndicator();
  }

  // --- PANEL UI EVENTS ---
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
    syncUIToState();
  });

  settingsClose.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
  });

  providerTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.provider = btn.dataset.provider;
      syncUIToState();
    });
  });

  modelPills.forEach(btn => {
    btn.addEventListener('click', () => {
      state.tier = btn.dataset.tier;
      syncUIToState();
    });
  });

  connectBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (state.provider === 'custom') {
      state.custom.endpoint = customEndpointInput.value.trim();
      state.custom.model = customModelInput.value.trim();
    }
    state.keys[state.provider] = key;
    saveState();
    connectBtn.textContent = '✓ Connected';
    setTimeout(() => {
      connectBtn.textContent = 'Connect Provider';
      settingsPanel.classList.remove('active');
    }, 1500);
  });

  // --- CHAT LOGIC ---
  function openChat() {
    chatModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => chatInput.focus(), 300);
    syncUIToState();
  }

  function closeChat() {
    chatModal.classList.remove('active');
    settingsPanel.classList.remove('active');
    document.body.style.overflow = '';
  }

  function clearChat() {
    messages = [];
    chatMessages.innerHTML = `
      <div class="chat-modal__welcome">
        <span class="chat-modal__welcome-icon">🧠</span>
        <h3 class="chat-modal__welcome-title">Welcome to AI Brain</h3>
        <p class="chat-modal__welcome-text">Select your preferred AI Provider and enter an API Key to begin interacting.</p>
      </div>
    `;
  }

  function addMessageUI(content, isUser = false) {
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
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }

  async function sendMessage() {
    if (isStreaming) return;
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    
    // Add User message
    messages.push({ role: 'user', content: text });
    addMessageUI(text, true);

    const apiKey = state.keys[state.provider];
    if (!apiKey) {
      addMessageUI("⚠️ No API Key found for this provider. Please open Settings (⚙️) and add your key.", false);
      messages.pop(); // Remove user message from history if failed
      return;
    }

    isStreaming = true;

    // AI message shell
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message chat-message--ai';
    msgEl.innerHTML = `
      <div class="chat-message__avatar">🧠</div>
      <div class="chat-message__content"></div>
    `;
    chatMessages.appendChild(msgEl);
    const contentEl = msgEl.querySelector('.chat-message__content');
    
    let aiResponseText = "";

    try {
      await streamAIResponse(
        state.provider, 
        state.tier, 
        apiKey, 
        messages, 
        (chunk) => {
          aiResponseText += chunk;
          contentEl.innerHTML = formatMessage(aiResponseText);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        },
        state.custom
      );
      messages.push({ role: 'assistant', content: aiResponseText });
    } catch (err) {
      aiResponseText += `\n\n**Error:** ${err.message}`;
      contentEl.innerHTML = formatMessage(aiResponseText);
      messages.pop(); // Revert user message to prevent breaking context window
    } finally {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      isStreaming = false;
    }
  }

  // --- EVENTS ---
  searchInput.addEventListener('click', openChat);
  chatOverlay.addEventListener('click', closeChat);
  chatClose.addEventListener('click', closeChat);
  chatClear.addEventListener('click', clearChat);
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
    if (e.key === 'Escape') {
      closeChat();
    }
  });
}
