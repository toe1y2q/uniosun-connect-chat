
-- Create appeals table for user complaints and appeals
CREATE TABLE public.appeals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('account', 'payment', 'session', 'other')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for appeals
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Users can create their own appeals
CREATE POLICY "Users can create their own appeals" 
    ON public.appeals 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own appeals
CREATE POLICY "Users can view their own appeals" 
    ON public.appeals 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" 
    ON public.appeals 
    FOR SELECT 
    USING (get_current_user_role() = 'admin');

-- Admins can update appeals (add responses, change status)
CREATE POLICY "Admins can update appeals" 
    ON public.appeals 
    FOR UPDATE 
    USING (get_current_user_role() = 'admin');

-- Add last_seen field to users for real-time response tracking
ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the updated_at trigger for appeals
CREATE TRIGGER update_appeals_updated_at 
    BEFORE UPDATE ON public.appeals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Allow admins to update reports status
CREATE POLICY "Admins can update reports" 
    ON public.reports 
    FOR UPDATE 
    USING (get_current_user_role() = 'admin');

-- Allow viewing flagged messages for session participants and administrators
CREATE POLICY "Admins can view all reports" 
    ON public.reports 
    FOR SELECT 
    USING (get_current_user_role() = 'admin');

-- Update users last_seen when they're active
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_seen = now() 
    WHERE id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
