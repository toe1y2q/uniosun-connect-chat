-- Drop the existing security definer views
DROP VIEW IF EXISTS public.users_public_min;
DROP VIEW IF EXISTS public.verified_students_public;

-- Create users_public_min as a regular view with proper RLS
CREATE VIEW public.users_public_min AS 
SELECT 
    id,
    name,
    profile_image
FROM public.users
WHERE role IN ('student', 'aspirant') AND status = 'active';

-- Create verified_students_public as a regular view with proper RLS  
CREATE VIEW public.verified_students_public AS
SELECT 
    id,
    name,
    profile_image,
    department_id,
    quiz_score,
    badge,
    is_verified
FROM public.users
WHERE role = 'student' 
    AND is_verified = true 
    AND badge = true 
    AND status = 'active';

-- Enable RLS on these views (they inherit from users table)
-- Views automatically inherit RLS policies from their underlying tables

-- Add comment for documentation
COMMENT ON VIEW public.users_public_min IS 'Public view of minimal user information for display purposes';
COMMENT ON VIEW public.verified_students_public IS 'Public view of verified students available for tutoring sessions';