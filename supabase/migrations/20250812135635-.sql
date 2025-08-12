-- 1) Remove overly-broad public access and fix aspirant policy on users
-- Drop the policy that exposes all users' data to public
DROP POLICY IF EXISTS "Public can view verified students" ON public.users;

-- Replace the aspirant policy with a strictly row-based filter (no OR on role)
DROP POLICY IF EXISTS "Aspirants can view verified students for booking" ON public.users;
CREATE POLICY "Aspirants can view verified students for booking"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'student'::user_role
  AND is_verified = true
  AND badge = true
);

-- Keep admin full visibility (already exists), keep self-view policies (already exist)

-- 2) Create a safe public view with minimal columns only
CREATE OR REPLACE VIEW public.verified_students_public AS
SELECT 
  id,
  name,
  profile_image,
  department_id,
  quiz_score,
  badge,
  is_verified
FROM public.users
WHERE role = 'student'::user_role AND is_verified = true AND badge = true;

-- Grant read access on the view to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.verified_students_public TO anon, authenticated;

-- 3) Optional: prevent future accidental broad grants on users (documented; no DDL required)

-- 4) Security best practice: harden function search_path (informational)
-- Note: Changes to function definitions should be handled separately if needed.
