-- Admin INSERT policies for companies and logos
-- Run this in Supabase SQL Editor

-- Allow admins to insert companies
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to update companies
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  USING (is_admin());

-- Allow admins to insert logos
DROP POLICY IF EXISTS "Admins can insert logos" ON logos;
CREATE POLICY "Admins can insert logos"
  ON logos FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to update logos
DROP POLICY IF EXISTS "Admins can update logos" ON logos;
CREATE POLICY "Admins can update logos"
  ON logos FOR UPDATE
  USING (is_admin());

-- Allow admins to upload to logos bucket
DROP POLICY IF EXISTS "Admins can upload logos" ON storage.objects;
CREATE POLICY "Admins can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND is_admin()
  );
