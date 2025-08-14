-- Lock down users table: remove aspirant-wide select and rely on public views
DROP POLICY IF EXISTS "Aspirants can view verified students for booking" ON public.users;

-- Minimal public profile view for future-safe usage (non-sensitive)
CREATE OR REPLACE VIEW public.users_public_min AS
SELECT id, name, profile_image
FROM public.users;

GRANT SELECT ON public.users_public_min TO anon, authenticated;