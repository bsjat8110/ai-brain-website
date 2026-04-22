// api/gemini.js — Vercel Serverless Function: Gemini Proxy
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  let body;
  try {
    body = await req.json();
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

  const { model = 'gemini-2.0-flash', messages, stream = false, systemPrompt } = body;

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
