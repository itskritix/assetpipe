-- Add key_prefix column to api_keys table
-- This stores a visible prefix of the key for display purposes

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT;

-- Update existing rows to have a prefix (first 10 chars of key_hash)
UPDATE api_keys SET key_prefix = LEFT(key_hash, 10) WHERE key_prefix IS NULL;
