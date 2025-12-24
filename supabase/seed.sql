-- Seed data for development

-- Insert some sample companies
INSERT INTO companies (id, name, slug, domain, description, website_url, is_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'GitHub', 'github', 'github.com', 'Where the world builds software', 'https://github.com', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Stripe', 'stripe', 'stripe.com', 'Financial infrastructure for the internet', 'https://stripe.com', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Vercel', 'vercel', 'vercel.com', 'Develop. Preview. Ship.', 'https://vercel.com', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Supabase', 'supabase', 'supabase.com', 'The open source Firebase alternative', 'https://supabase.com', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Cloudflare', 'cloudflare', 'cloudflare.com', 'The Web Performance & Security Company', 'https://cloudflare.com', true);

-- Note: In production, logos would be stored in R2 and these paths would be R2 URLs
-- For development, these are placeholder paths
INSERT INTO logos (company_id, format, variant, storage_path, width, height) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'svg', 'primary', '/logos/github/primary.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440001', 'png', 'primary', '/logos/github/primary.png', 512, 512),
  ('550e8400-e29b-41d4-a716-446655440001', 'svg', 'icon', '/logos/github/icon.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'svg', 'primary', '/logos/stripe/primary.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'png', 'primary', '/logos/stripe/primary.png', 512, 512),
  ('550e8400-e29b-41d4-a716-446655440003', 'svg', 'primary', '/logos/vercel/primary.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'svg', 'icon', '/logos/vercel/icon.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'svg', 'primary', '/logos/supabase/primary.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'svg', 'icon', '/logos/supabase/icon.svg', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440005', 'svg', 'primary', '/logos/cloudflare/primary.svg', NULL, NULL);

-- Insert brand kits for some companies
INSERT INTO brand_kits (company_id, primary_color, secondary_colors, fonts) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '#24292e', '["#0366d6", "#28a745", "#ffd33d"]', '{"primary": "Inter", "monospace": "SFMono-Regular"}'),
  ('550e8400-e29b-41d4-a716-446655440002', '#635bff', '["#00d4ff", "#0a2540"]', '{"primary": "Stripe Font"}'),
  ('550e8400-e29b-41d4-a716-446655440003', '#000000', '["#ffffff"]', '{"primary": "Inter"}'),
  ('550e8400-e29b-41d4-a716-446655440004', '#3ecf8e', '["#1c1c1c", "#ffffff"]', '{"primary": "Source Sans Pro"}'),
  ('550e8400-e29b-41d4-a716-446655440005', '#f38020', '["#404040", "#ffffff"]', '{"primary": "Open Sans"}');
