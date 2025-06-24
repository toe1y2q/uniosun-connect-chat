
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create policies for the avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

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
