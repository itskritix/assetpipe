import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../index';

export const companies = new Hono<{ Bindings: Env }>();

// GET /v1/companies - List all companies (paginated)
companies.get('/', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('companies')
    .select('id, name, slug, domain, description, website_url, is_verified, created_at', { count: 'exact' })
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({
      error: { code: 'DATABASE_ERROR', message: error.message },
    }, 500);
  }

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      has_more: count ? offset + limit < count : false,
    },
  });
});

// GET /v1/companies/:slug - Get company by slug
companies.get('/:slug', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const slug = c.req.param('slug');

  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      domain,
      description,
      website_url,
      is_verified,
      created_at,
      updated_at
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Company '${slug}' not found` },
    }, 404);
  }

  return c.json({ data });
});

// GET /v1/companies/:slug/logos - Get logos for a company
companies.get('/:slug/logos', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const slug = c.req.param('slug');
  const format = c.req.query('format'); // Optional: filter by format
  const variant = c.req.query('variant'); // Optional: filter by variant

  // First get the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (companyError || !company) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Company '${slug}' not found` },
    }, 404);
  }

  // Then get logos
  let query = supabase
    .from('logos')
    .select('id, format, variant, storage_path, width, height, file_size, created_at')
    .eq('company_id', company.id);

  if (format) {
    query = query.eq('format', format);
  }
  if (variant) {
    query = query.eq('variant', variant);
  }

  const { data: logos, error: logosError } = await query.order('variant');

  if (logosError) {
    return c.json({
      error: { code: 'DATABASE_ERROR', message: logosError.message },
    }, 500);
  }

  return c.json({
    data: {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      logos,
    },
  });
});

// GET /v1/companies/:slug/brand-kit - Get brand kit for a company
companies.get('/:slug/brand-kit', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const slug = c.req.param('slug');

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (companyError || !company) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Company '${slug}' not found` },
    }, 404);
  }

  const { data: brandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .select('id, primary_color, secondary_colors, fonts, guidelines_url, created_at')
    .eq('company_id', company.id)
    .single();

  if (brandKitError && brandKitError.code !== 'PGRST116') {
    return c.json({
      error: { code: 'DATABASE_ERROR', message: brandKitError.message },
    }, 500);
  }

  return c.json({
    data: {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      brand_kit: brandKit || null,
    },
  });
});
