
-- Create ENUM types for user roles and statuses
CREATE TYPE user_role AS ENUM ('student', 'aspirant', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'pending', 'blocked', 'banned');
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('payment', 'withdrawal', 'earning');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users table (students, aspirants, and admins)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  jamb_reg TEXT,
  role user_role NOT NULL DEFAULT 'aspirant',
  department_id UUID REFERENCES public.departments(id),
  is_verified BOOLEAN DEFAULT false,
  quiz_score INTEGER,
  badge BOOLEAN DEFAULT false,
  status user_status DEFAULT 'active',
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN DEFAULT false,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions table for bookings
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.users(id) NOT NULL, -- aspirant
  student_id UUID REFERENCES public.users(id) NOT NULL, -- student
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes (30 or 60)
  amount INTEGER NOT NULL, -- in kobo (100000 for ₦1000, 150000 for ₦1500)
  payment_status TEXT DEFAULT 'pending',
  status session_status DEFAULT 'pending',
  paystack_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  message TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0, -- in kobo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  session_id UUID REFERENCES public.sessions(id),
  amount INTEGER NOT NULL, -- in kobo
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  reference TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reports table for flagged content
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) NOT NULL,
  flagged_by UUID REFERENCES public.users(id) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  reviewer_id UUID REFERENCES public.users(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (readable by all authenticated users)
CREATE POLICY "Anyone can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can view verified students" ON public.users
  FOR SELECT TO authenticated USING (role = 'student' AND is_verified = true AND badge = true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- RLS Policies for questions (students can view their department questions)
CREATE POLICY "Students can view department questions" ON public.questions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.department_id = questions.department_id
    )
  );

-- RLS Policies for quiz attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own quiz attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions
  FOR SELECT TO authenticated USING (client_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Aspirants can create sessions" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.sessions
  FOR UPDATE TO authenticated USING (client_id = auth.uid() OR student_id = auth.uid());

-- RLS Policies for chat messages
CREATE POLICY "Users can view messages from their sessions" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = chat_messages.session_id 
      AND (sessions.client_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their sessions" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = chat_messages.session_id 
      AND (sessions.client_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can view reports they created" ON public.reports
  FOR SELECT TO authenticated USING (flagged_by = auth.uid());

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (flagged_by = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews for their sessions" ON public.reviews
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = reviews.session_id 
      AND (sessions.client_id = auth.uid() OR sessions.student_id = auth.uid())
    )
  );

CREATE POLICY "Users can create reviews for their sessions" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = reviews.session_id 
      AND sessions.client_id = auth.uid()
    )
  );

-- Insert sample departments
INSERT INTO public.departments (name) VALUES 
  ('Computer Science'),
  ('Medicine'),
  ('Law'),
  ('Engineering'),
  ('Business Administration'),
  ('Mass Communication'),
  ('Psychology'),
  ('Chemistry'),
  ('Physics'),
  ('Mathematics');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aspirant')
  );
  
  -- Create wallet for the new user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR each ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR each ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR each ROW EXECUTE PROCEDURE public.update_updated_at_column();
