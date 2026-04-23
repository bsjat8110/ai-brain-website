// api/gemini.js — Vercel Serverless Function: Gemini Proxy
// Uses classic Node.js handler (req, res) — Vercel needs res.end() to close response.
// Returning new Response() without res parameter leaves response hanging → 504 timeout.

import { checkRateLimit, validateBody, getClientIp, CORS_HEADERS } from './_ratelimit.js';

export default async function handler(req, res) {
  // Set CORS headers on every response
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Rate limiting: 20 requests per minute per IP
  const ip = getClientIp(req);
  const { allowed, resetAt } = checkRateLimit(ip, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    res.setHeader('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Gemini API key not configured on server.' });
    return;
  }

  // req.body is auto-parsed by Vercel for application/json Content-Type
  const body = req.body;

  const { valid, error: validationError } = validateBody(body);
  if (!valid) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { model = 'gemini-2.0-flash', messages, stream = false, systemPrompt } = body || {};

  // Build Gemini request contents
  const contents = [];
  if (messages && Array.isArray(messages)) {
    for (const m of messages) {
      if (m.role === 'user' || m.role === 'model') {
        contents.push({ role: m.role, parts: [{ text: m.content }] });
      }
    }
  }

  const geminiBody = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };
  if (systemPrompt) {
    geminiBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const endpoint = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);

    // Stream chunks directly to client
    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
}
