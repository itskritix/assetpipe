import { Context, Next } from 'hono';
import type { Env } from '../index';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,   // 1 minute
  maxRequests: 100,      // 100 requests per minute
};

interface RateLimitData {
  count: number;
  resetAt: number;
}

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const apiKey = c.req.header('Authorization')?.slice(7) || 'anonymous';
    const kvKey = `rate_limit:${apiKey}`;

    const now = Date.now();

    // Get current rate limit data from KV
    let data: RateLimitData | null = null;

    try {
      const stored = await c.env.RATE_LIMIT_KV.get(kvKey);
      if (stored) {
        data = JSON.parse(stored);
      }
    } catch {
      // KV read failed, continue without rate limiting
    }

    // Initialize or reset if window expired
    if (!data || now >= data.resetAt) {
      data = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Increment count
    data.count++;

    // Check if over limit
    if (data.count > maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);

      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil(data.resetAt / 1000)));
      c.header('Retry-After', String(retryAfter));

      return c.json({
        error: {
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
      }, 429);
    }

    // Store updated count in KV (fire and forget)
    try {
      const ttl = Math.ceil(windowMs / 1000) + 1;
      c.env.RATE_LIMIT_KV.put(kvKey, JSON.stringify(data), { expirationTtl: ttl });
    } catch {
      // KV write failed, continue anyway
    }

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(maxRequests - data.count));
    c.header('X-RateLimit-Reset', String(Math.ceil(data.resetAt / 1000)));

    await next();
  };
}
