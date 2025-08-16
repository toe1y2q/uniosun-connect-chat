-- Fix security definer views by setting security_invoker = true
-- This resolves the security vulnerability where views enforce creator's permissions
-- instead of the querying user's permissions

-- Alter the existing views to use security_invoker
ALTER VIEW public.users_public_min SET (security_invoker = true);
ALTER VIEW public.verified_students_public SET (security_invoker = true);

-- Add comments to document the security change
COMMENT ON VIEW public.users_public_min IS 'Public view of minimal user information for display purposes - uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.verified_students_public IS 'Public view of verified students available for tutoring sessions - uses security_invoker for proper RLS enforcement';