/**
 * AI Brain Router
 * Handles intelligent routing to officially supported AI providers and custom endpoints.
 * Prioritizes native fetch for streaming over heavy SDKs to preserve application runtime performance.
 */

const PROVIDER_MODELS = {
  gemini: {
    fast: 'gemini-1.5-flash-8b',
    medium: 'gemini-1.5-flash',
    pro: 'gemini-1.5-pro'
  },
  openai: {
    fast: 'gpt-4o-mini',
    medium: 'gpt-3.5-turbo',
    pro: 'gpt-4o'
  },
  claude: {
    fast: 'claude-3-haiku-20240307',
    medium: 'claude-3-sonnet-20240229',
    pro: 'claude-3-opus-20240229'
  }
};

/**
 * Stream a response from the selected AI provider.
 * @param {string} provider 'gemini', 'openai', 'claude', or 'custom'
 * @param {string} tier 'fast', 'medium', 'pro'
 * @param {string} apiKey User-provided API key
 * @param {Array} messages Chat history array formatted {role: 'user'|'assistant', content: string}
 * @param {Function} onChunk Callback triggered when a chunk of text arrives
 * @param {object} customConfig Object holding { endpoint, model } if provider is 'custom'
 */
export async function streamAIResponse(provider, tier, apiKey, messages, onChunk, customConfig = null) {
  if (!apiKey) throw new Error(`Missing API Key for ${provider}. Please enter it in the settings.`);

  const systemPrompt = "You are AI Brain, a highly advanced, persistent intelligence architecture designed to assist users with knowledge synthesis, autonomous action planning, and deep research.";

  try {
    if (provider === 'gemini') {
      await streamGemini(PROVIDER_MODELS.gemini[tier], apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'openai') {
      await streamOpenAI(PROVIDER_MODELS.openai[tier], apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'claude') {
      await streamClaude(PROVIDER_MODELS.claude[tier], apiKey, messages, systemPrompt, onChunk);
    } else if (provider === 'custom') {
      if (!customConfig || !customConfig.endpoint || !customConfig.model) {
        throw new Error("Missing Custom Provider configuration. Please supply Endpoint URL and Model Name.");
      }
      await streamOpenAI(customConfig.model, apiKey, messages, systemPrompt, onChunk, customConfig.endpoint);
    } else {
      throw new Error(`Provider ${provider} is not supported.`);
    }
  } catch (err) {
    console.error(`AI Routing Error [${provider}]:`, err);
    throw new Error(err.message || 'An error occurred while connecting to the AI provider. Please verify your API Key.');
  }
}

async function streamGemini(model, apiKey, messages, systemPrompt, onChunk) {
  // Simple mapping to Gemini format. (User and Model roles).
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  
  // Inject system prompt explicitly since standard REST approach sometimes requires specific handling
  contents.unshift({
    role: "user",
    parts: [{ text: `SYSTEM DIRECTIVE: ${systemPrompt}` }]
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error: ${response.status} ${errorBody}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep last incomplete line

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const chunkMatch = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkMatch) onChunk(chunkMatch);
        } catch (e) {
          // ignore incomplete JSON lines
        }
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
    body: JSON.stringify({
      model: model,
      messages: formattedMessages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} ${errorBody}`);
  }

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
        } catch (e) { }
      }
    }
  }
}

async function streamClaude(model, apiKey, messages, systemPrompt, onChunk) {
  // Convert standard roles for Anthropic. Claude handles text internally differently.
  // Note: We are attempting a standard generic Anthropic connection.
  // Anthropic API requests usually go through backend due to CORS.
  // We'll enforce the Anthropic-Version header and x-api-key.
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerously-allow-browser': 'true' // Necessary for client-side fetching
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API Error: ${response.status} ${errorBody}`);
  }

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
        } catch (e) { }
      }
    }
  }
}
