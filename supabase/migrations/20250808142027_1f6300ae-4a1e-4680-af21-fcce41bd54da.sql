-- Promote specified user(s) to admin so they can manage withdrawals
-- This migration only updates existing data; no schema changes

-- Ensure the enum includes 'admin' (it should already exist). If not, uncomment the next line.
-- DO NOT run by default to avoid errors if enum already has value
-- ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';

-- Promote the project owner account to admin
UPDATE public.users
SET role = 'admin'
WHERE email IN ('pithyentertaiment@gmail.com');

-- Verify (for logs) - optional in migration, but harmless as a no-op result
-- SELECT id, email, role FROM public.users WHERE email IN ('pithyentertaiment@gmail.com');