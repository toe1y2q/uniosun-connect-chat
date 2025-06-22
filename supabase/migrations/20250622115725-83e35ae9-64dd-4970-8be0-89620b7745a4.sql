
-- Add Flutterwave and banking fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS flutterwave_subaccount_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'failed')),
  flutterwave_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on withdrawals table
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update sessions table to include payment reference
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS flutterwave_reference TEXT;

-- Update transactions table to include withdrawal type
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('payment', 'withdrawal', 'earning'));

-- Create trigger to update wallet balance on earnings
CREATE OR REPLACE FUNCTION update_wallet_on_earning()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'earning' AND NEW.status = 'completed' THEN
    UPDATE public.users 
    SET wallet_balance = COALESCE(wallet_balance, 0) + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_on_earning
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_earning();
