
-- Add columns to chat_messages table for content filtering and replies
ALTER TABLE public.chat_messages 
ADD COLUMN is_flagged_content boolean DEFAULT false,
ADD COLUMN flagged_content_reason text;

-- Create a table to store restricted keywords/phrases
CREATE TABLE public.restricted_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  category text NOT NULL, -- 'academic', 'university', 'general'
  created_at timestamp with time zone DEFAULT now()
);

-- Insert some basic academic-related keywords that are allowed
INSERT INTO public.restricted_content (keyword, category) VALUES
('admission', 'academic'),
('department', 'academic'),
('uniosun', 'university'),
('university', 'university'),
('course', 'academic'),
('study', 'academic'),
('exam', 'academic'),
('lecture', 'academic'),
('tutorial', 'academic'),
('assignment', 'academic'),
('project', 'academic'),
('research', 'academic'),
('grade', 'academic'),
('scholarship', 'academic'),
('faculty', 'academic'),
('student', 'academic'),
('learning', 'academic'),
('education', 'academic');

-- Create RLS policy for restricted_content (admin only)
ALTER TABLE public.restricted_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage restricted content" 
  ON public.restricted_content 
  FOR ALL 
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view restricted content" 
  ON public.restricted_content 
  FOR SELECT 
  USING (true);

-- Update chat_messages policies to allow updates for flagging
CREATE POLICY "Users can update their own messages for deletion" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (sender_id = auth.uid());

-- Create trigger to automatically release payment when aspirant submits review
CREATE OR REPLACE FUNCTION public.release_payment_on_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this is an aspirant's review (reviewer is client)
  IF EXISTS (
    SELECT 1 FROM sessions s 
    WHERE s.id = NEW.session_id 
    AND s.client_id = NEW.reviewer_id
  ) THEN
    -- Create earning transaction for student
    INSERT INTO public.transactions (
      user_id, 
      session_id, 
      amount, 
      type, 
      status, 
      description
    )
    SELECT 
      s.student_id,
      s.id,
      (s.amount * 0.8)::integer, -- 80% to student
      'earning',
      'completed',
      'Session payment - ' || s.description
    FROM sessions s
    WHERE s.id = NEW.session_id;
    
    -- Update session status to completed
    UPDATE sessions 
    SET status = 'completed'
    WHERE id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment release
CREATE TRIGGER trigger_release_payment_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.release_payment_on_review();
