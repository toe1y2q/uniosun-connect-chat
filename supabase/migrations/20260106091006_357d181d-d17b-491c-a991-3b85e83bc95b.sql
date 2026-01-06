-- Add 'employer' to the existing user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'employer';

-- Add new columns to users table for employer features
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employer_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employer_badge BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT;

-- Create campuses table for nationwide structure
CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('university', 'polytechnic', 'college')),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on campuses
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

-- Anyone can view campuses
CREATE POLICY "Anyone can view campuses" ON public.campuses
FOR SELECT USING (true);

-- Only admins can manage campuses
CREATE POLICY "Admins can manage campuses" ON public.campuses
FOR ALL USING (get_current_user_role() = 'admin');

-- Create gigs table
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('micro-jobs', 'freelance', 'campus-hustles', 'internships', 'remote', 'tutoring', 'delivery', 'events', 'design', 'writing', 'tech')),
  location_type TEXT NOT NULL CHECK (location_type IN ('campus', 'city', 'state', 'nationwide', 'remote')),
  campus_id UUID REFERENCES public.campuses(id),
  city TEXT,
  state TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  payment_type TEXT CHECK (payment_type IN ('fixed', 'hourly')),
  duration_estimate TEXT,
  skills_required JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'paused')),
  applicants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on gigs
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- Anyone can view open gigs
CREATE POLICY "Anyone can view open gigs" ON public.gigs
FOR SELECT USING (status = 'open' OR employer_id = auth.uid());

-- Employers can create gigs
CREATE POLICY "Employers can create gigs" ON public.gigs
FOR INSERT WITH CHECK (auth.uid() = employer_id AND get_current_user_role() = 'employer');

-- Employers can update their own gigs
CREATE POLICY "Employers can update their own gigs" ON public.gigs
FOR UPDATE USING (employer_id = auth.uid());

-- Employers can delete their own gigs
CREATE POLICY "Employers can delete their own gigs" ON public.gigs
FOR DELETE USING (employer_id = auth.uid());

-- Admins can manage all gigs
CREATE POLICY "Admins can manage all gigs" ON public.gigs
FOR ALL USING (get_current_user_role() = 'admin');

-- Create gig_applications table
CREATE TABLE IF NOT EXISTS public.gig_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT,
  proposed_amount INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gig_id, student_id)
);

-- Enable RLS on gig_applications
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

-- Students can view their own applications
CREATE POLICY "Students can view their own applications" ON public.gig_applications
FOR SELECT USING (student_id = auth.uid());

-- Employers can view applications for their gigs
CREATE POLICY "Employers can view applications for their gigs" ON public.gig_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_applications.gig_id 
    AND gigs.employer_id = auth.uid()
  )
);

-- Students can create applications
CREATE POLICY "Students can create applications" ON public.gig_applications
FOR INSERT WITH CHECK (auth.uid() = student_id AND get_current_user_role() = 'student');

-- Students can update their own applications (withdraw)
CREATE POLICY "Students can update their own applications" ON public.gig_applications
FOR UPDATE USING (student_id = auth.uid());

-- Employers can update applications for their gigs (accept/reject)
CREATE POLICY "Employers can update applications for their gigs" ON public.gig_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.gigs 
    WHERE gigs.id = gig_applications.gig_id 
    AND gigs.employer_id = auth.uid()
  )
);

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" ON public.gig_applications
FOR ALL USING (get_current_user_role() = 'admin');

-- Create trigger to update gigs updated_at
CREATE TRIGGER update_gigs_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update gig_applications updated_at
CREATE TRIGGER update_gig_applications_updated_at
  BEFORE UPDATE ON public.gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update applicants_count
CREATE OR REPLACE FUNCTION public.update_gig_applicants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gigs SET applicants_count = applicants_count + 1 WHERE id = NEW.gig_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.gigs SET applicants_count = applicants_count - 1 WHERE id = OLD.gig_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update applicants count
CREATE TRIGGER update_applicants_count
  AFTER INSERT OR DELETE ON public.gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gig_applicants_count();

-- Insert some Nigerian states for reference
INSERT INTO public.campuses (name, type, city, state) VALUES
  ('University of Lagos', 'university', 'Lagos', 'Lagos'),
  ('University of Ibadan', 'university', 'Ibadan', 'Oyo'),
  ('Obafemi Awolowo University', 'university', 'Ile-Ife', 'Osun'),
  ('University of Nigeria Nsukka', 'university', 'Nsukka', 'Enugu'),
  ('Ahmadu Bello University', 'university', 'Zaria', 'Kaduna'),
  ('University of Benin', 'university', 'Benin City', 'Edo'),
  ('University of Port Harcourt', 'university', 'Port Harcourt', 'Rivers'),
  ('Lagos State University', 'university', 'Lagos', 'Lagos'),
  ('Covenant University', 'university', 'Ota', 'Ogun'),
  ('Yaba College of Technology', 'polytechnic', 'Lagos', 'Lagos'),
  ('Federal Polytechnic Nekede', 'polytechnic', 'Owerri', 'Imo'),
  ('Kaduna Polytechnic', 'polytechnic', 'Kaduna', 'Kaduna')
ON CONFLICT DO NOTHING;