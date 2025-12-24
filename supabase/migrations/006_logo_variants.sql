-- Migration: Add variant_type and color_mode to logos and submission_files
-- This replaces the single 'variant' column with a two-dimensional system

-- ============================================
-- UPDATE LOGOS TABLE
-- ============================================

-- Add new columns
ALTER TABLE logos ADD COLUMN IF NOT EXISTS variant_type TEXT DEFAULT 'primary';
ALTER TABLE logos ADD COLUMN IF NOT EXISTS color_mode TEXT DEFAULT 'color';

-- Add constraints
ALTER TABLE logos DROP CONSTRAINT IF EXISTS logos_variant_type_check;
ALTER TABLE logos ADD CONSTRAINT logos_variant_type_check
  CHECK (variant_type IN ('primary', 'icon', 'wordmark', 'horizontal', 'stacked'));

ALTER TABLE logos DROP CONSTRAINT IF EXISTS logos_color_mode_check;
ALTER TABLE logos ADD CONSTRAINT logos_color_mode_check
  CHECK (color_mode IN ('color', 'dark', 'light', 'mono-black', 'mono-white'));

-- Migrate existing data from 'variant' column
UPDATE logos SET
  variant_type = CASE
    WHEN variant IN ('primary', 'icon', 'wordmark', 'horizontal', 'stacked') THEN variant
    ELSE 'primary'
  END,
  color_mode = CASE
    WHEN variant IN ('dark', 'light', 'mono-black', 'mono-white') THEN variant
    WHEN variant = 'color' THEN 'color'
    ELSE 'color'
  END
WHERE variant_type IS NULL OR color_mode IS NULL;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_logos_variant_type ON logos (variant_type);
CREATE INDEX IF NOT EXISTS idx_logos_color_mode ON logos (color_mode);

-- ============================================
-- UPDATE SUBMISSION_FILES TABLE
-- ============================================

-- Add new columns
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS variant_type TEXT DEFAULT 'primary';
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS color_mode TEXT DEFAULT 'color';

-- Add constraints
ALTER TABLE submission_files DROP CONSTRAINT IF EXISTS submission_files_variant_type_check;
ALTER TABLE submission_files ADD CONSTRAINT submission_files_variant_type_check
  CHECK (variant_type IN ('primary', 'icon', 'wordmark', 'horizontal', 'stacked'));

ALTER TABLE submission_files DROP CONSTRAINT IF EXISTS submission_files_color_mode_check;
ALTER TABLE submission_files ADD CONSTRAINT submission_files_color_mode_check
  CHECK (color_mode IN ('color', 'dark', 'light', 'mono-black', 'mono-white'));

-- Migrate existing data from 'variant' column
UPDATE submission_files SET
  variant_type = CASE
    WHEN variant IN ('primary', 'icon', 'wordmark', 'horizontal', 'stacked') THEN variant
    ELSE 'primary'
  END,
  color_mode = CASE
    WHEN variant IN ('dark', 'light', 'mono-black', 'mono-white') THEN variant
    WHEN variant = 'color' THEN 'color'
    ELSE 'color'
  END
WHERE variant_type IS NULL OR color_mode IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submission_files_variant_type ON submission_files (variant_type);
CREATE INDEX IF NOT EXISTS idx_submission_files_color_mode ON submission_files (color_mode);
