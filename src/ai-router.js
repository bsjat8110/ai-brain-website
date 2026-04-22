/**
 * AI Brain Router - Self Healing Enterprise Implementation
 * Handles intelligent routing, automatic model discovery, fallback resolution, and secure validation.
 */

const PROVIDER_MODELS = { // Safe defaults — updated April 2026
  gemini: { fast: 'gemini-2.0-flash', medium: 'gemini-2.0-flash', pro: 'gemini-2.5-pro-preview-03-25' },
  openai: { fast: 'gpt-4o-mini', medium: 'gpt-4o', pro: 'gpt-4o' },
  claude: { fast: 'claude-3-5-haiku-20241022', medium: 'claude-3-5-sonnet-20241022', pro: 'claude-3-5-sonnet-20241022' }
};

const TIER_MAPPING = {
  gemini: { fast: ['flash-8b', 'flash', '2.0-flash'], medium: ['flash', 'pro', '2.0-flash'], pro: ['2.5-pro', 'pro'] },
  openai: { fast: ['gpt-4o-mini', 'gpt-3.5'], medium: ['gpt-4-turbo', 'gpt-4o-mini'], pro: ['gpt-4o', 'gpt-4'] },
  claude: { fast: ['haiku'], medium: ['sonnet'], pro: ['opus', 'sonnet'] }
};

const FALLBACK_CHAINS = {
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0-pro'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  // Updated April 2026: claude-3-5-haiku/sonnet are current stable models
  claude: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
};

/**
 * Fetch available models from the provider.
 * For server-side providers (gemini/openai/claude), validates via proxy and returns fallback defaults.
 */
export async function fetchAvailableModels(provider, apiKey, customConfig = null) {
  try {
    if (provider === 'gemini') {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: PROVIDER_MODELS.gemini.fast, messages: [{ role: 'user', content: 'ping' }], stream: false }),
      });
      if (!res.ok) throw new Error("Gemini API key not configured on server. Set GEMINI_API_KEY in Vercel environment variables.");
      return FALLBACK_CHAINS.gemini;
    } 
    else if (provider === 'openai') {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: PROVIDER_MODELS.openai.fast, messages: [{ role: 'user', content: 'ping' }], stream: false }),
      });
      if (!res.ok) throw new Error("OpenAI API key not configured on server. Set OPENAI_API_KEY in Vercel environment variables.");
      return FALLBACK_CHAINS.openai;
    } 
    else if (provider === 'claude') {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: PROVIDER_MODELS.claude.fast, messages: [{ role: 'user', content: 'ping' }], stream: false }),
      });
      if (!res.ok) throw new Error("Anthropic API key not configured on server. Set ANTHROPIC_API_KEY in Vercel environment variables.");
      return FALLBACK_CHAINS.claude;
    } 
    else if (provider === 'custom') {
      if (!customConfig || !customConfig.endpoint || !customConfig.model) throw new Error("Missing custom config");
      try {
         const url = customConfig.endpoint.includes('/chat/completions') 
                   ? customConfig.endpoint.replace('/chat/completions', '/models') 
                   : customConfig.endpoint;
         const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` }});
         if (res.ok) {
            const data = await res.json();
            if (data.data) return data.data.map(m => m.id);
         }
      } catch(e) {}
      return [customConfig.model];
    }
  } catch (err) {
    throw new Error(`Connection failed: Could not validate ${provider}. ${err.message}`);
  }
}

/**
 * Validates connection before activating the provider in the settings.
 * For server-side providers (gemini/openai/claude), validates via proxy (no browser-side key needed).
 * For custom provider, apiKey is still required.
 */
export async function validateProviderConnection(provider, apiKey, customConfig = null) {
  if (provider === 'custom') {
    if (!apiKey) throw new Error("API key is required for custom provider.");
    if (!customConfig || !customConfig.endpoint || !customConfig.model) {
      throw new Error("Custom provider requires an endpoint and a model name.");
    }
  }
  
  const models = await fetchAvailableModels(provider, apiKey, customConfig);
  if (!models || models.length === 0) {
    if (provider !== 'custom') throw new Error("Provider returned no accessible models.");
  }
  return models;
}

/**
 * Finds the best supported model by mapping UI tier to real API models.
 */
export function getBestModelForTier(provider, tier, availableModels) {
  if (provider === 'custom') return null;
  if (!availableModels || availableModels.length === 0) return PROVIDER_MODELS[provider][tier];

  const preferredTokens = TIER_MAPPING[provider]?.[tier] || [];
  
  // 1. Check preferred models
  for (const token of preferredTokens) {
    const matched = availableModels.find(avail => avail.includes(token));
    if (matched) return matched;
  }
  
  // 2. Fallback to generic chain
  const chain = FALLBACK_CHAINS[provider] || [];
  for (const m of chain) {
    const matched = availableModels.find(avail => avail.includes(m) || m.includes(avail));
    if (matched) return matched;
  }
  
  // 3. Fallback to hardcoded default
  return PROVIDER_MODELS[provider][tier];
}

/**
 * Stream a response from the selected AI provider with self-healing fallback.
 * For server-side providers (gemini/openai/claude), requests are proxied via /api/* endpoints.
 * apiKey is only used for the custom provider.
 */
export async function streamAIResponse(provider, tier, apiKey, messages, onChunk, customConfig = null, availableModels = [], memoryContext = '', languagePreference = 'auto', aiMode = 'normal') {
  if (provider === 'custom' && !apiKey) throw new Error(`Missing API Key for custom provider. Please enter it in the settings.`);

  let systemPrompt = "You are AI Brain, a highly advanced, persistent intelligence architecture designed to assist users with knowledge synthesis, autonomous action planning, and deep research." + memoryContext;
  
  // Inject Personality Mode Directives
  if (aiMode === 'teacher') {
    systemPrompt += "\n\nPERSONALITY: You are in Teacher Mode. Explain concepts clearly, step-by-step, using analogies where helpful. Assume the user is a student eager to learn.";
  } else if (aiMode === 'advisor') {
    systemPrompt += "\n\nPERSONALITY: You are a Startup Advisor. Provide practical, business-focused advice. Focus on product-market fit, scaling, and strategy. Be concise and professional.";
  } else if (aiMode === 'coder') {
    systemPrompt += "\n\nPERSONALITY: You are a Coding Assistant. Focus strictly on programming, algorithms, and technical guidance. Provide clean code snippets and technical explanations.";
  } else {
    systemPrompt += "\n\nPERSONALITY: You are in AI Brain Mode. Respond naturally, helpfully, and factually based on the user's query.";
  }
  
  // Inject Language Preferences
  if (languagePreference === 'hindi') {
    systemPrompt += "\n\nIMPORTANT INSTRUCTION: The user has strictly requested responses in Hindi (Devanagari script). You MUST write your entire response ONLY in Hindi using Devanagari script. Do NOT use English letters for Hindi words.";
  } else if (languagePreference === 'english') {
    systemPrompt += "\n\nIMPORTANT INSTRUCTION: The user has strictly requested responses in English. You MUST reply ONLY in English.";
  } else if (languagePreference === 'hinglish') {
    systemPrompt += "\n\nIMPORTANT INSTRUCTION: The user has strictly requested responses in Hinglish. You MUST reply using a natural mix of Hindi and English words, written entirely in the English/Latin alphabet. (e.g. 'Ye feature bahut useful hai, isse start karte hain.').";
  }

  let targetModel = getBestModelForTier(provider, tier, availableModels);
  if (provider === 'custom') targetModel = customConfig.model;
  
  const tryStream = async (modelToTry) => {
    if (provider === 'gemini') {
      await streamGemini(modelToTry, messages, systemPrompt, onChunk);
    } else if (provider === 'openai') {
      await streamOpenAI(modelToTry, messages, systemPrompt, onChunk);
    } else if (provider === 'claude') {
      await streamClaude(modelToTry, messages, systemPrompt, onChunk);
    } else if (provider === 'custom') {
      await streamCustom(modelToTry, apiKey, messages, systemPrompt, onChunk, customConfig.endpoint);
    }
  };

  try {
     await tryStream(targetModel);
  } catch (err) {
     console.warn(`[AI Router] Model ${targetModel} failed: ${err.message}. Attempting fallback...`);
     
     if (provider === 'custom') throw err; // Cannot automatically fallback a custom endpoint
     
     // Find the safest, lightest fallback model that isn't the target
     const chain = FALLBACK_CHAINS[provider] || [];
     let fallbackModel = null;
     
     for (const m of chain) {
         let match = '';
         if (availableModels.length > 0) {
            match = availableModels.find(avail => avail.includes(m)) || m;
         } else {
            match = m;
         }

         if (match !== targetModel) {
            fallbackModel = match;
            break;
         }
     }
     
     if (!fallbackModel) throw err; // No fallback available
     
     console.warn(`[AI Router] Re-routing to fallback: ${fallbackModel}`);
     await tryStream(fallbackModel);
  }
}

/* --- PROVIDER STREAMING IMPLEMENTATIONS --- */

async function streamGemini(model, messages, systemPrompt, onChunk) {
  // Map 'assistant' → 'model' and filter out any 'system' roles — Gemini only accepts 'user' or 'model'
  const normalizedMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'model')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      content: m.content
    }));

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: normalizedMessages, stream: true, systemPrompt })
  });
  
  if (!response.ok) throw new Error(`Gemini API Error: ${response.status} ${await response.text()}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const chunkMatch = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkMatch) onChunk(chunkMatch);
        } catch (e) {}
      }
    }
  }
}

async function streamOpenAI(model, messages, systemPrompt, onChunk) {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, systemPrompt })
  });
  if (!response.ok) throw new Error(`OpenAI API Error: ${response.status} ${await response.text()}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const chunkMatch = data.choices?.[0]?.delta?.content;
          if (chunkMatch) onChunk(chunkMatch);
        } catch (e) {}
      }
    }
  }
}

async function streamClaude(model, messages, systemPrompt, onChunk) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, systemPrompt })
  });
  if (!response.ok) throw new Error(`Claude API Error: ${response.status} ${await response.text()}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        try {
          const data = JSON.parse(dataStr);
          if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
            onChunk(data.delta.text);
          }
        } catch (e) {}
      }
    }
  }
}

async function streamCustom(model, apiKey, messages, systemPrompt, onChunk, baseUrl) {
  const formattedMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: model, messages: formattedMessages, stream: true })
  });
  if (!response.ok) throw new Error(`Custom API Error: ${response.status} ${await response.text()}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const chunkMatch = data.choices?.[0]?.delta?.content;
          if (chunkMatch) onChunk(chunkMatch);
        } catch (e) {}
      }
    }
  }
}

/* --- BACKGROUND KNOWLEDGE EXTRACTION (NON-STREAMING) --- */

/**
 * Non-streaming backend inference wrapper to run silent background tasks.
 * For server-side providers (gemini/openai/claude), requests are proxied via /api/* endpoints.
 * apiKey is only used for the custom provider.
 */
export async function invokeAI(provider, tier, apiKey, messages, systemPrompt, customConfig = null, availableModels = [], languagePreference = 'auto', aiMode = 'normal') {
  if (provider === 'custom' && !apiKey) throw new Error(`Missing API Key for custom provider.`);
  
  let finalPrompt = systemPrompt;
  
  // Inject Personality Mode Directives for background extraction (slightly less verbose)
  if (aiMode === 'teacher') finalPrompt += " (You are acting as a Teacher)";
  else if (aiMode === 'advisor') finalPrompt += " (You are acting as a Startup Advisor)";
  else if (aiMode === 'coder') finalPrompt += " (You are acting as a Coding Assistant)";

  if (languagePreference === 'hindi') {
    finalPrompt += "\n\nIMPORTANT INSTRUCTION: Ensure extracted data concepts or logic respect the Hindi language context if applicable, though JSON keys must remain exact.";
  } else if (languagePreference === 'hinglish') {
    finalPrompt += "\n\nIMPORTANT INSTRUCTION: Ensure extracted data concepts or logic respect the Hinglish language context if applicable, though JSON keys must remain exact.";
  }

  let targetModel = getBestModelForTier(provider, tier, availableModels);
  if (provider === 'custom') targetModel = customConfig.model;

  let modelToTry = targetModel;

  try {
    if (provider === 'gemini') {
      // Map 'assistant' → 'model' and filter out 'system' roles — Gemini only accepts 'user' or 'model'
      const normalizedMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'model')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          content: m.content
        }));
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelToTry, messages: normalizedMessages, stream: false, systemPrompt: finalPrompt })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      
    } else if (provider === 'openai') {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelToTry, messages, stream: false, systemPrompt: finalPrompt })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
      
    } else if (provider === 'claude') {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelToTry, messages, stream: false, systemPrompt: finalPrompt })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.content?.[0]?.text || null;

    } else if (provider === 'custom') {
      const formattedMessages = [{ role: 'system', content: finalPrompt }, ...messages];
      const response = await fetch(customConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelToTry, messages: formattedMessages })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch(e) {
    console.error(`[AI Router] Invoke AI failed for ${provider} with model ${modelToTry}:`, e);
    return null; // Return null on error instead of throwing, for silent background tasks
  }
  return null; // Should not be reached if provider is handled, but as a safeguard
}
