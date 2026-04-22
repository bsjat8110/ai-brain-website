// api/claude.js — Vercel Serverless Function: Anthropic/Claude Proxy
// Fluid Compute (default) — Edge runtime deprecated, Fluid has full Node.js + same regions/price

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { model = 'claude-3-haiku-20240307', messages, stream = false, systemPrompt } = body;

  const claudeMessages = [];
  if (messages && Array.isArray(messages)) {
    for (const m of messages) {
      // Claude uses the separate `system` field (handled via systemPrompt above);
      // 'system' role messages in the array are intentionally excluded here.
      if (m.role === 'user' || m.role === 'assistant' || m.role === 'model') {
        claudeMessages.push({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content,
        });
      }
    }
  }

  const claudeBody = {
    model,
    max_tokens: 2048,
    messages: claudeMessages,
    ...(systemPrompt && { system: systemPrompt }),
    ...(stream && { stream: true }),
  };

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(claudeBody),
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': 'https://aibrainstartup.com',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
