-- Create function to handle withdrawal requests
CREATE OR REPLACE FUNCTION public.handle_withdrawal_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger for withdrawal requests
CREATE TRIGGER on_withdrawal_request
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_request();

-- Create function to handle withdrawal cancellation/rejection
CREATE OR REPLACE FUNCTION public.handle_withdrawal_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If withdrawal is cancelled or rejected, return money to wallet
  IF OLD.status = 'requested' AND NEW.status IN ('cancelled', 'rejected') THEN
    UPDATE public.users 
    SET wallet_balance = wallet_balance + OLD.amount
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for withdrawal status updates
CREATE TRIGGER on_withdrawal_status_change
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_cancelled();