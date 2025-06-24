
-- Add pithyentertainment@gmail.com as admin user in the users table
INSERT INTO public.users (id, email, name, role, is_verified, badge, wallet_balance, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'pithyentertainment@gmail.com',
  'Admin User',
  'admin',
  true,
  false,
  0,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_verified = true;
