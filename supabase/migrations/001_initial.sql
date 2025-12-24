-- AssetPipe Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TABLES
-- ============================================

-- Companies/Brands table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  description TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies (slug);
CREATE INDEX idx_companies_domain ON companies (domain);

-- Logo assets table
CREATE TABLE logos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('svg', 'png')),
  variant TEXT DEFAULT 'primary',
  storage_path TEXT NOT NULL,
  width INT,
  height INT,
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logos_company ON logos (company_id);

-- Brand kit metadata table
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  primary_color TEXT,
  secondary_colors JSONB,
  fonts JSONB,
  guidelines_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brand_kits_company ON brand_kits (company_id);

-- User submissions table (pending approval)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_user ON submissions (user_id);
CREATE INDEX idx_submissions_status ON submissions (status);

-- Submission files table (before approval)
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  format TEXT,
  variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submission_files_submission ON submission_files (submission_id);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  request_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys (user_id);
CREATE INDEX idx_api_keys_hash ON api_keys (key_hash);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Companies: Anyone can read
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

-- Logos: Anyone can read
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logos are viewable by everyone"
  ON logos FOR SELECT
  USING (true);

-- Brand kits: Anyone can read
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand kits are viewable by everyone"
  ON brand_kits FOR SELECT
  USING (true);

-- Submissions: Users can read their own
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Submission files: Same as submissions
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their submission files"
  ON submission_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = submission_files.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create submission files"
  ON submission_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = submission_files.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

-- API keys: Users can only manage their own
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
