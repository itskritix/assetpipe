import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../index';

export const logos = new Hono<{ Bindings: Env }>();

// GET /v1/logos/:id - Get logo metadata by ID
logos.get('/:id', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('logos')
    .select(`
      id,
      format,
      variant,
      storage_path,
      width,
      height,
      file_size,
      created_at,
      companies (
        id,
        name,
        slug
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Logo '${id}' not found` },
    }, 404);
  }

  return c.json({ data });
});

// GET /v1/logos/:id/download - Download logo file
logos.get('/:id/download', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const id = c.req.param('id');

  const { data: logo, error } = await supabase
    .from('logos')
    .select('storage_path, format, companies(name, slug)')
    .eq('id', id)
    .single();

  if (error || !logo) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Logo '${id}' not found` },
    }, 404);
  }

  // Get file from R2
  const object = await c.env.LOGOS_BUCKET.get(logo.storage_path);

  if (!object) {
    return c.json({
      error: { code: 'NOT_FOUND', message: 'Logo file not found in storage' },
    }, 404);
  }

  const contentType = logo.format === 'svg' ? 'image/svg+xml' : 'image/png';
  const companies = logo.companies as unknown as { name: string; slug: string }[] | null;
  const company = companies?.[0];
  const filename = company ? `${company.slug}-logo.${logo.format}` : `logo.${logo.format}`;

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

// GET /v1/logos/:id/view - View logo file (inline, for embedding)
logos.get('/:id/view', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
  const id = c.req.param('id');

  const { data: logo, error } = await supabase
    .from('logos')
    .select('storage_path, format')
    .eq('id', id)
    .single();

  if (error || !logo) {
    return c.json({
      error: { code: 'NOT_FOUND', message: `Logo '${id}' not found` },
    }, 404);
  }

  // Get file from R2
  const object = await c.env.LOGOS_BUCKET.get(logo.storage_path);

  if (!object) {
    return c.json({
      error: { code: 'NOT_FOUND', message: 'Logo file not found in storage' },
    }, 404);
  }

  const contentType = logo.format === 'svg' ? 'image/svg+xml' : 'image/png';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});
