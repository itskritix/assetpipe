-- Admin policies for submissions
-- Run this in Supabase SQL Editor

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email IN ('itskritix@gmail.com')
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to view ALL submissions
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  USING (is_admin());

-- Allow admins to update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  USING (is_admin());

-- Allow admins to view all submission files
CREATE POLICY "Admins can view all submission files"
  ON submission_files FOR SELECT
  USING (is_admin());
