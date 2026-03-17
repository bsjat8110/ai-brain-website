/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Chat System with Multi-Provider Support
   ═══════════════════════════════════════════════════════════ */

import { streamAIResponse, validateProviderConnection, invokeAI } from './ai-router.js';
import { retrieveContext, mergeKnowledge, EXTRACTION_PROMPT } from './memory-brain.js';

export function initChat() {
  const searchInput = document.getElementById('search-input');
  const chatModal = document.getElementById('chat-modal');
  const chatOverlay = document.getElementById('chat-overlay');
  const chatClose = document.getElementById('chat-close');
  const chatClear = document.getElementById('chat-clear');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const chatLangDropdown = document.getElementById('chat-lang-dropdown');
  const chatModeDropdown = document.getElementById('chat-mode-dropdown');

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
  const errorBox = document.getElementById('provider-error');

  if (!searchInput || !chatModal) return;

  // --- STATE MANAGEMENT ---
  let messages = JSON.parse(localStorage.getItem('aiData_history') || '[]');
  let isStreaming = false;

  let state = {
    provider: localStorage.getItem('aiData_provider') || 'gemini',
    tier: localStorage.getItem('aiData_tier') || 'fast',
    language: localStorage.getItem('aiData_language') || 'auto',
    aiMode: localStorage.getItem('aiData_mode') || 'normal',
    keys: JSON.parse(localStorage.getItem('aiData_keys') || '{}'),
    custom: JSON.parse(localStorage.getItem('aiData_custom') || '{"endpoint":"","model":""}'),
    availableModels: JSON.parse(localStorage.getItem('aiData_models') || '{}')
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
    if (chatLangDropdown) chatLangDropdown.value = state.language;
    if (chatModeDropdown) chatModeDropdown.value = state.aiMode;
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
    localStorage.setItem('aiData_language', state.language);
    localStorage.setItem('aiData_mode', state.aiMode);
    localStorage.setItem('aiData_keys', JSON.stringify(state.keys));
    localStorage.setItem('aiData_custom', JSON.stringify(state.custom));
    localStorage.setItem('aiData_models', JSON.stringify(state.availableModels));
    updateActiveModelIndicator();
  }

  // --- PANEL UI EVENTS ---
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
    errorBox.classList.add('hidden');
    syncUIToState();
  });

  settingsClose.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
    errorBox.classList.add('hidden');
  });

  providerTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.provider = btn.dataset.provider;
      errorBox.classList.add('hidden');
      syncUIToState();
    });
  });

  modelPills.forEach(btn => {
    btn.addEventListener('click', () => {
      state.tier = btn.dataset.tier;
      syncUIToState();
      saveState();
    });
  });

  if (chatLangDropdown) {
    chatLangDropdown.addEventListener('change', (e) => {
      state.language = e.target.value;
      saveState();
    });
  }

  if (chatModeDropdown) {
    chatModeDropdown.addEventListener('change', (e) => {
      state.aiMode = e.target.value;
      saveState();
      clearChat();
    });
  }

  connectBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (state.provider === 'custom') {
      state.custom.endpoint = customEndpointInput.value.trim();
      state.custom.model = customModelInput.value.trim();
    }
    connectBtn.textContent = 'Validating...';
    connectBtn.disabled = true;
    errorBox.classList.add('hidden');
    try {
      const models = await validateProviderConnection(state.provider, key, state.provider === 'custom' ? state.custom : null);
      state.keys[state.provider] = key;
      state.availableModels[state.provider] = models;
      saveState();
      connectBtn.textContent = '✓ Connected';
      setTimeout(() => {
        connectBtn.textContent = 'Connect Provider';
        connectBtn.disabled = false;
        settingsPanel.classList.remove('active');
      }, 1500);
    } catch (err) {
      errorBox.textContent = err.message || 'Connection failed. Please check your configurations.';
      errorBox.classList.remove('hidden');
      connectBtn.textContent = 'Connect Provider';
      connectBtn.disabled = false;
    }
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
    localStorage.removeItem('aiData_history');
    chatMessages.innerHTML = `
      <div class="chat-modal__welcome">
        <span class="chat-modal__welcome-icon">🧠</span>
        <h3 class="chat-modal__welcome-title">Welcome to AI Brain</h3>
        <p class="chat-modal__welcome-text">Select your preferred AI Provider and enter an API Key to begin interacting.</p>
      </div>
    `;
  }

  function renderHistory() {
    if (messages.length === 0) {
      clearChat();
      return;
    }
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-message chat-message--${msg.role === 'user' ? 'user' : 'ai'}`;
      msgEl.innerHTML = `
        <div class="chat-message__avatar">${msg.role === 'user' ? '👤' : '🧠'}</div>
        <div class="chat-message__content">${formatMessage(msg.content)}</div>
      `;
      chatMessages.appendChild(msgEl);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  renderHistory();

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
    scrollToBottom();
  }

  function scrollToBottom() {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }

  // --- SECURITY: XSS Prevention — escape HTML before rendering AI/user content ---
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMessage(text) {
    // Step 1: Escape all HTML to block XSS injection from AI responses or user input
    const escaped = escapeHtml(text);
    // Step 2: Apply safe markdown-like formatting on the escaped text only
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // --- TOKEN COMPACTION ENGINE ---
  function compactHistory() {
    const historyString = JSON.stringify(messages);
    const estimatedTokens = historyString.length / 4;
    const TOKEN_LIMIT = 50000;
    if (estimatedTokens > TOKEN_LIMIT) {
      console.warn(`[AI Router] Token limit approaching (${Math.round(estimatedTokens)}). Compacting history...`);
      messages = messages.slice(-4);
      localStorage.setItem('aiData_history', JSON.stringify(messages));
      const notice = document.createElement('div');
      notice.className = 'chat-message chat-message--ai';
      notice.innerHTML = `<span style=\"font-size: 0.8rem; color: var(--color-text-secondary); opacity: 0.7;\">⚙️ System: Chat history compacted to preserve memory & context bounds.</span>`;
      chatMessages.appendChild(notice);
    }
  }

  async function sendMessage() {
    if (isStreaming) return;
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    messages.push({ role: 'user', content: text });
    localStorage.setItem('aiData_history', JSON.stringify(messages));
    addMessageUI(text, true);

    const apiKey = state.keys[state.provider];
    if (!apiKey) {
      addMessageUI("⚠️ No API Key found for this provider. Please open Settings (⚙️) and add your key.", false);
      messages.pop();
      return;
    }

    isStreaming = true;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message chat-message--ai';
    msgEl.innerHTML = `
      <div class="chat-message__avatar">🧠</div>
      <div class="chat-message__content"></div>
    `;
    chatMessages.appendChild(msgEl);
    const contentEl = msgEl.querySelector('.chat-message__content');
    
    let aiResponseText = "";
    let backgroundMemoryTask = null;

    try {
      compactHistory();
      const graphContext = retrieveContext(text);

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
        state.custom,
        state.availableModels[state.provider] || [],
        graphContext,
        state.language,
        state.aiMode
      );
      
      messages.push({ role: 'assistant', content: aiResponseText });
      localStorage.setItem('aiData_history', JSON.stringify(messages));
      
      const recentExchange = messages.slice(-2);
      backgroundMemoryTask = invokeAI(
         state.provider, 
         state.tier, 
         apiKey, 
         recentExchange, 
         EXTRACTION_PROMPT, 
         state.custom, 
         state.availableModels[state.provider] || [],
         state.language,
         state.aiMode
      ).then(jsonExtraction => {
         if(jsonExtraction) mergeKnowledge(jsonExtraction);
      }).catch(e => console.warn("Background extraction skipped."));

    } catch (err) {
      aiResponseText += `\n\n**Error:** ${err.message}`;
      contentEl.innerHTML = formatMessage(aiResponseText);
      messages.pop();
      localStorage.setItem('aiData_history', JSON.stringify(messages));
    } finally {
      scrollToBottom();
      isStreaming = false;
    }
  }

  // --- MOBILE KEYBOARD ADAPTATION ---
  function handleVisualViewport() {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const offset = window.innerHeight - vv.height;
    const inputArea = document.querySelector('.chat-modal__input-area');
    if (inputArea && chatModal.classList.contains('active')) {
      if (offset > 50) {
        inputArea.style.transform = `translateY(-${offset}px)`;
      } else {
        inputArea.style.transform = 'translateY(0)';
      }
      scrollToBottom();
    }
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewport);
    window.visualViewport.addEventListener('scroll', handleVisualViewport);
  }

  // --- EVENTS ---
  searchInput.addEventListener('click', openChat);
  chatOverlay.addEventListener('click', closeChat);
  chatClose.addEventListener('click', closeChat);
  chatClear.addEventListener('click', clearChat);
  chatSend.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 200)}px`;
  });

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