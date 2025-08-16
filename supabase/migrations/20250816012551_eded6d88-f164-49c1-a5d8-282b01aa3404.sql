-- Fix security definer functions by adding SET search_path for security
-- This addresses both the security definer view warning and function search path warnings

-- Update the get_current_user_role function with proper search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

-- Update withdrawal handling functions with proper search path
CREATE OR REPLACE FUNCTION public.handle_withdrawal_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user has sufficient balance
  IF (SELECT wallet_balance FROM public.users WHERE id = NEW.user_id) < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance for withdrawal';
  END IF;
  
  -- Deduct amount from user's wallet balance immediately when withdrawal is requested
  UPDATE public.users 
  SET wallet_balance = wallet_balance - NEW.amount
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_withdrawal_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If withdrawal is cancelled or rejected, return money to wallet
  IF OLD.status = 'requested' AND NEW.status IN ('cancelled', 'rejected') THEN
    UPDATE public.users 
    SET wallet_balance = wallet_balance + OLD.amount
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_payment_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.users 
    SET last_seen = now() 
    WHERE id = auth.uid();
    RETURN NEW;
END;
$function$;

-- Update other functions that also need search_path set
CREATE OR REPLACE FUNCTION public.update_wallet_on_earning()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.type = 'earning' AND NEW.status = 'completed' THEN
    UPDATE public.users 
    SET wallet_balance = COALESCE(wallet_balance, 0) + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_wallet_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- For payment transactions, deduct from wallet
  IF NEW.type = 'payment' AND NEW.status = 'completed' THEN
    UPDATE public.users 
    SET wallet_balance = COALESCE(wallet_balance, 0) - NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  
  -- For earning transactions, add to wallet
  IF NEW.type = 'earning' AND NEW.status = 'completed' THEN
    UPDATE public.users 
    SET wallet_balance = COALESCE(wallet_balance, 0) + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    -- Function logic here
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;