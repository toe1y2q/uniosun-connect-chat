-- Fix the release_payment_on_review function to be SECURITY DEFINER
-- This allows it to bypass RLS when creating legitimate payment transactions

CREATE OR REPLACE FUNCTION public.release_payment_on_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER  -- This allows the function to bypass RLS
AS $function$
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
$function$;