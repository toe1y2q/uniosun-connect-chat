
-- Add missing RLS policies for user registration and proper access

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Allow admins to view all users (needed for admin dashboard)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to update any user (for verification)
CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow aspirants to view verified students for booking
CREATE POLICY "Aspirants can view verified students for booking" ON public.users
  FOR SELECT TO authenticated USING (
    (role = 'student' AND is_verified = true AND badge = true) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'aspirant'
    )
  );
