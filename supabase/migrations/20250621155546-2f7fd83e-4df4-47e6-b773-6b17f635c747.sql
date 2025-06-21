
-- Grant admin privileges to the specified email (using UPSERT to handle if user already exists)
INSERT INTO public.users (id, email, name, role, is_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tolu8610@gmail.com',
  'Admin User',
  'admin',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_verified = true;

-- Allow public (unauthenticated) users to view verified students for the public talent page
CREATE POLICY "Public can view verified students" ON public.users
  FOR SELECT TO anon USING (
    role = 'student' AND is_verified = true AND badge = true
  );

-- Allow public access to departments for registration
CREATE POLICY "Public can view departments" ON public.departments
  FOR SELECT TO anon USING (true);
