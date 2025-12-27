# AssetPipe Development Guide

## Tech Stack

- **Frontend**: Astro 5 + Tailwind CSS
- **Backend API**: Hono (Cloudflare Workers)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (submissions, logos buckets)
- **Auth**: Supabase Auth
- **Hosting**: Cloudflare Pages (web) + Cloudflare Workers (API)
- **Package Manager**: pnpm (monorepo)

## Project Structure

```
assetpipe/
├── apps/
│   ├── web/                 # Astro frontend
│   │   ├── src/
│   │   │   ├── layouts/     # Layout components
│   │   │   ├── lib/         # Utilities (supabase, config)
│   │   │   ├── pages/       # Astro pages & API routes
│   │   │   └── styles/      # CSS
│   │   ├── astro.config.mjs
│   │   └── wrangler.toml    # Cloudflare Pages config
│   └── api/                 # Hono API worker
│       ├── src/
│       │   └── index.ts
│       └── wrangler.toml    # Cloudflare Workers config
├── packages/
│   └── shared/              # Shared types & utilities
└── package.json
```

## Local Development Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Wrangler CLI (`pnpm add -g wrangler`)
- Supabase account

### 1. Clone & Install

```bash
git clone <repo-url>
cd assetpipe
pnpm install
```

### 2. Environment Variables

Create `apps/web/.env`:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Create `apps/api/.dev.vars`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Supabase Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  description TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Logos table
CREATE TABLE logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- 'svg' or 'png'
  variant_type TEXT NOT NULL, -- 'primary', 'icon', 'wordmark', 'horizontal', 'stacked'
  color_mode TEXT NOT NULL, -- 'color', 'dark', 'light', 'mono-black', 'mono-white'
  storage_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand kits table
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  primary_color TEXT,
  secondary_colors TEXT[],
  fonts JSONB,
  guidelines_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  company_domain TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Submission files table
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  format TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  color_mode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read logos" ON logos FOR SELECT USING (true);
CREATE POLICY "Public read brand_kits" ON brand_kits FOR SELECT USING (true);

-- User policies for submissions
CREATE POLICY "Users read own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own submission_files" ON submission_files
  FOR SELECT USING (
    submission_id IN (SELECT id FROM submissions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users create submission_files" ON submission_files
  FOR INSERT WITH CHECK (
    submission_id IN (SELECT id FROM submissions WHERE user_id = auth.uid())
  );

-- API keys policies
CREATE POLICY "Users read own api_keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create api_keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own api_keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_logos_company_id ON logos(company_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

### 4. Supabase Storage Setup

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Storage policies for submissions bucket (private)
CREATE POLICY "Auth users upload to submissions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'submissions' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Auth users read own submissions" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'submissions' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for logos bucket (public)
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Service role write logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos');
```

### 5. Admin Configuration

Edit `apps/web/src/lib/config.ts` to add admin emails:

```typescript
export const ADMIN_EMAILS = [
  'your-email@example.com',
];
```

## Running Locally

```bash
# Build shared packages first
pnpm build

# Run web app (Astro)
cd apps/web
pnpm dev

# Run API (in another terminal)
cd apps/api
pnpm dev
```

## Deployment

### Cloudflare Setup

1. Login to Cloudflare:
```bash
wrangler login
```

2. Create R2 bucket (for API):
```bash
wrangler r2 bucket create assetpipe-logos
```

3. Create KV namespaces:
```bash
wrangler kv namespace create RATE_LIMIT_KV
wrangler kv namespace create SESSION
```

4. Set secrets for API:
```bash
cd apps/api
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

### Deploy

```bash
# Deploy API
cd apps/api
pnpm deploy:api

# Deploy Web
cd apps/web
pnpm build
wrangler pages deploy dist --project-name assetpipe --branch main
```

## Key Flows

### User Submission Flow
1. User signs in
2. User uploads logo files on `/submit`
3. Files uploaded to `submissions` bucket
4. Submission record created with `pending` status

### Admin Approval Flow
1. Admin views pending submissions at `/admin/submissions`
2. Admin clicks APPROVE
3. API endpoint:
   - Creates company record (if new)
   - Copies files from `submissions` to `logos` bucket
   - Creates logo records
   - Updates submission status to `approved`
4. Logos now visible in `/browse`

### Storage URL Patterns
- **Submissions (private)**: Uses signed URLs (1 hour expiry)
- **Logos (public)**: `{SUPABASE_URL}/storage/v1/object/public/logos/{path}`

## Troubleshooting

### 500 Error on Cloudflare Pages
- Ensure `vite.ssr.noExternal` includes Supabase packages in `astro.config.mjs`
- Check compatibility flags (`nodejs_compat`) in wrangler.toml

### Images Not Loading
- Verify storage buckets exist and are public (for logos)
- Check storage_path values in database match actual file paths
- Ensure RLS policies allow read access

### Auth Issues
- Verify Supabase URL and anon key are correct
- Check cookies are being set properly
- Verify redirect URLs in Supabase Auth settings
