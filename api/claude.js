// api/claude.js — Vercel Serverless Function: Anthropic/Claude Proxy
// Fluid Compute (default) — Edge runtime deprecated, Fluid has full Node.js + same regions/price

import { checkRateLimit, validateBody, getClientIp, CORS_HEADERS, optionsResponse, rateLimitResponse } from './_ratelimit.js';

export default async function handler(req) {
  // Handle CORS preflight — required for browser cross-origin requests
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Rate limiting: 20 requests per minute per IP
  const ip = getClientIp(req);
  const { allowed, resetAt } = checkRateLimit(ip, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Vercel Node.js runtime: body is pre-parsed on req.body (not req.json())
  let body;
  try {
    body = req.body !== undefined ? req.body : await req.json();
    if (typeof body === 'string') body = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Input validation
  const { valid, error: validationError } = validateBody(body);
  if (!valid) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const { model = 'claude-3-5-haiku-20241022', messages, stream = false, systemPrompt } = body;

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
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
