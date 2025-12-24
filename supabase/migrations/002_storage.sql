-- Storage buckets for AssetPipe
-- Run this in Supabase SQL Editor after enabling Storage

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos', 'logos', true),
  ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos bucket (public read)
CREATE POLICY "Logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Storage policies for submissions bucket

-- Users can upload to their own folder
CREATE POLICY "Users can upload submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submissions'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own submission files
CREATE POLICY "Users can view their own submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all submission files (for review)
CREATE POLICY "Admins can view all submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND is_admin()
  );

-- Users can delete their own submission files
CREATE POLICY "Users can delete their own submission files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
