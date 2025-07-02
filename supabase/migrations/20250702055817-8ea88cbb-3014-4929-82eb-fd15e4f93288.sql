-- Add description column to sessions table for better payment tracking
ALTER TABLE public.sessions ADD COLUMN description TEXT;

-- Update wallet balance trigger function to use transactions
CREATE OR REPLACE FUNCTION public.update_wallet_on_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_wallet_on_earning ON public.transactions;

-- Create new trigger for wallet updates
CREATE TRIGGER update_wallet_on_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_payment();