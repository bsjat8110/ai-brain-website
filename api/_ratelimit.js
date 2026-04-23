// api/_ratelimit.js — Shared rate limiting & CORS utilities for all API routes
// Uses in-memory sliding window per serverless instance.
// Not globally distributed (no Redis), but effective against single-source abuse.

const rateLimitStore = new Map();

/**
 * Checks whether an IP is within the allowed rate limit.
 * @param {string} ip  — Client IP address
 * @param {object} options
 * @param {number} options.windowMs  — Time window in milliseconds (default: 60s)
 * @param {number} options.max       — Max requests per window per IP (default: 20)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(ip, { windowMs = 60_000, max = 20 } = {}) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  // New IP or window expired — reset counter
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count++;
  rateLimitStore.set(ip, entry);

  // Cleanup stale entries to prevent memory leak in long-lived instances
  if (rateLimitStore.size > 2000) {
    for (const [key, val] of rateLimitStore) {
      if (now > val.resetAt) rateLimitStore.delete(key);
    }
  }

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Validates request body — ensures messages array isn't too large.
 * @param {object} body — Parsed request body
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }
  if (body.messages && Array.isArray(body.messages)) {
    if (body.messages.length > 100) {
      return { valid: false, error: 'Too many messages in history (max 100).' };
    }
    for (const msg of body.messages) {
      if (typeof msg.content === 'string' && msg.content.length > 32_000) {
        return { valid: false, error: 'Message content too long (max 32,000 characters).' };
      }
    }
  }
  return { valid: true };
}

// Shared CORS headers for all responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://aibrainstartup.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
};

/** Responds to CORS preflight (OPTIONS) requests */
export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Returns a 429 Too Many Requests response */
export function rateLimitResponse(resetAt) {
  const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSecs),
        ...CORS_HEADERS,
      },
    }
  );
}

/** Returns the client IP from Vercel request headers.
 *  Vercel Node.js runtime: req.headers is a plain object (not Web Fetch Headers),
 *  so we use bracket notation, not .get(). */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}
