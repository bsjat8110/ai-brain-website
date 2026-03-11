/**
 * AI Brain Router - Self Healing Enterprise Implementation
 * Handles intelligent routing, automatic model discovery, fallback resolution, and secure validation.
 */

const PROVIDER_MODELS = { // Safe defaults
  gemini: { fast: 'gemini-1.5-flash', medium: 'gemini-1.5-flash', pro: 'gemini-1.5-pro' },
  openai: { fast: 'gpt-4o-mini', medium: 'gpt-3.5-turbo', pro: 'gpt-4o' },
  claude: { fast: 'claude-3-haiku-20240307', medium: 'claude-3-sonnet-20240229', pro: 'claude-3-opus-20240229' }
};

const TIER_MAPPING = {
  gemini: { fast: ['flash-8b', 'flash'], medium: ['flash', 'pro'], pro: ['pro'] },
  openai: { fast: ['gpt-4o-mini', 'gpt-3.5'], medium: ['gpt-4-turbo', 'gpt-4o-mini'], pro: ['gpt-4o', 'gpt-4'] },
  claude: { fast: ['haiku'], medium: ['sonnet'], pro: ['opus', 'sonnet'] }
};

const FALLBACK_CHAINS = {
  gemini: ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-pro', 'gemini-1.0-pro'],
  openai: ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4'],
  claude: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-5-sonnet-20240620']
};

/**
 * Fetch available models from the provider's /models API.
 */
export async function fetchAvailableModels(provider, apiKey, customConfig = null) {
  try {
    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) throw new Error("API Key validation failed");
      const data = await res.json();
      return data.models.map(m => m.name.replace('models/', '')).filter(m => m.includes('gemini'));
    } 
    else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
      if (!res.ok) throw new Error("API Key validation failed");
      const data = await res.json();
      return data.data.map(m => m.id);
    } 
    else if (provider === 'claude') {
      // Anthropic /v1/models might not be fully exposed for all keys inside browsers natively.
      // We will perform a tiny validation request if models endpoint fails.
      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerously-allow-browser': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          return data.data.map(m => m.id);
        }
      } catch (e) {}
      // Silent fallback to standard models array if endpoint is restricted.
      return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620'];
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
    throw new Error(`Connection failed: Could not validate ${provider}. Check your API key. (${err.message})`);
  }
}

/**
 * Validates connection before activating the provider in the settings.
 */
export async function validateProviderConnection(provider, apiKey, customConfig = null) {
  if (!apiKey) throw new Error("API key is required.");
  if (provider === 'custom' && (!customConfig || !customConfig.endpoint || !customConfig.model)) {
    throw new Error("Custom provider requires an endpoint and a model name.");
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
 */
export async function streamAIResponse(provider, tier, apiKey, messages, onChunk, customConfig = null, availableModels = [], memoryContext = '') {
  if (!apiKey) throw new Error(`Missing API Key for ${provider}. Please enter it in the settings.`);

  const systemPrompt = "You are AI Brain, a highly advanced, persistent intelligence architecture designed to assist users with knowledge synthesis, autonomous action planning, and deep research." + memoryContext;

  let targetModel = getBestModelForTier(provider, tier, availableModels);
  if (provider === 'custom') targetModel = customConfig.model;
  
  const tryStream = async (modelToTry) => {
    if (provider === 'gemini') {
      await streamGemini(modelToTry, apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'openai') {
      await streamOpenAI(modelToTry, apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'claude') {
      await streamClaude(modelToTry, apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'custom') {
      await streamOpenAI(modelToTry, apiKey, messages, systemPrompt, onChunk, customConfig.endpoint);
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
     
     console.log(`[AI Router] Re-routing to fallback: ${fallbackModel}`);
     await tryStream(fallbackModel);
  }
}

/* --- PROVIDER STREAMING IMPLEMENTATIONS --- */

async function streamGemini(model, apiKey, messages, systemPrompt, onChunk) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  
  contents.unshift({ role: "user", parts: [{ text: `SYSTEM DIRECTIVE: ${systemPrompt}` }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
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

async function streamOpenAI(model, apiKey, messages, systemPrompt, onChunk, baseUrl = 'https://api.openai.com/v1/chat/completions') {
  const formattedMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: model, messages: formattedMessages, stream: true })
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

async function streamClaude(model, apiKey, messages, systemPrompt, onChunk) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerously-allow-browser': 'true'
    },
    body: JSON.stringify({ model: model, max_tokens: 1024, system: systemPrompt, messages, stream: true })
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

/* --- BACKGROUND KNOWLEDGE EXTRACTION (NON-STREAMING) --- */

/**
 * Invokes the AI model for a silent, non-streaming background task (like memory extraction).
 * Fast fail and no stream parsing.
 */
export async function invokeAI(provider, tier, apiKey, messages, systemPrompt, customConfig = null, availableModels = []) {
  let model = getBestModelForTier(provider, tier, availableModels);
  if (provider === 'custom') model = customConfig.model;
  
  if (provider === 'openai') {
     const formattedMessages = [{ role: 'system', content: systemPrompt }, ...messages];
     const res = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
       body: JSON.stringify({ model, messages: formattedMessages, stream: false })
     });
     if(res.ok) {
       const data = await res.json();
       return data.choices[0].message.content;
     }
  } else if (provider === 'gemini') {
     const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
     }));
     contents.unshift({ role: "user", parts: [{ text: `SYSTEM DIRECTIVE: ${systemPrompt}` }] });
     const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
     });
     if(res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
     }
  } else if (provider === 'claude') {
     const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({ model, max_tokens: 1024, system: systemPrompt, messages, stream: false })
     });
     if(res.ok) {
        const data = await res.json();
        return data.content[0].text;
     }
  }
  return "";
}
