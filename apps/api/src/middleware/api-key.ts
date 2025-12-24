import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../index';

export async function apiKeyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY',
      },
    }, 401);
  }

  const apiKey = authHeader.slice(7);

  // Hash the API key to compare with stored hash
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Verify API key in database
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, request_count')
    .eq('key_hash', keyHash)
    .single();

  if (error || !apiKeyRecord) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
      },
    }, 401);
  }

  if (!apiKeyRecord.is_active) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'API key has been deactivated',
      },
    }, 403);
  }

  // Update usage stats (fire and forget)
  supabase
    .from('api_keys')
    .update({
      request_count: (apiKeyRecord.request_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', apiKeyRecord.id)
    .then(() => {});

  await next();
}
