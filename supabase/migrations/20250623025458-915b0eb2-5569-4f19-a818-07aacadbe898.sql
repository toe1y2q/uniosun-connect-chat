
-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Aspirants can view verified students for booking" ON public.users;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT TO authenticated 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE TO authenticated 
  USING (public.get_current_user_role() = 'admin');

-- Create a safe policy for aspirants to view verified students
CREATE POLICY "Aspirants can view verified students for booking" ON public.users
  FOR SELECT TO authenticated 
  USING (
    (role = 'student' AND is_verified = true AND badge = true) OR
    public.get_current_user_role() = 'aspirant' OR
    public.get_current_user_role() = 'admin'
  );
