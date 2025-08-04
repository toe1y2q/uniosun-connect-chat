-- Add RLS policy for admins to view all withdrawals
CREATE POLICY "Admins can view all withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add RLS policy for admins to update withdrawals
CREATE POLICY "Admins can update all withdrawals" 
ON public.withdrawals 
FOR UPDATE 
USING (get_current_user_role() = 'admin');