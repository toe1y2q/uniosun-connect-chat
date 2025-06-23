
-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile during registration
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable select for users based on user_id" ON public.users
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON public.users
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Keep existing admin policies
-- (These should already exist from previous migrations)

-- Keep existing public view policy for verified students
-- (This should already exist from previous migrations)
