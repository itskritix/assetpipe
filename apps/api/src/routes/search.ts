import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../index';

export const search = new Hono<{ Bindings: Env }>();

// GET /v1/search?q=query - Search companies
search.get('/', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  const query = c.req.query('q');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  if (!query || query.length < 2) {
    return c.json({
      error: {
        code: 'INVALID_QUERY',
        message: 'Search query must be at least 2 characters',
      },
    }, 400);
  }

  // Search by name or domain
  const { data, error, count } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      domain,
      description,
      is_verified,
      logos (
        id,
        format,
        variant,
        storage_path
      )
    `, { count: 'exact' })
    .or(`name.ilike.%${query}%,domain.ilike.%${query}%`)
    .order('is_verified', { ascending: false })
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({
      error: { code: 'DATABASE_ERROR', message: error.message },
    }, 500);
  }

  return c.json({
    data,
    query,
    pagination: {
      page,
      limit,
      total: count || 0,
      has_more: count ? offset + limit < count : false,
    },
  });
});
