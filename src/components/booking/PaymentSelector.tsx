
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentSelectorProps {
  amount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  amount,
  onPaymentSuccess,
  onCancel
}) => {
  const { profile } = useAuth();

  // Fetch user's wallet balance
  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      return data?.wallet_balance || 0;
    },
    enabled: !!profile?.id
  });

  const canPayWithWallet = walletBalance && walletBalance >= amount;

  const handleWalletPayment = async () => {
    if (!canPayWithWallet || !profile?.id) return;
    
    try {
      // Deduct from wallet using raw SQL
      const { error } = await supabase.rpc('update_wallet_balance', {
        user_id: profile.id,
        amount_to_deduct: amount
      });

      if (error) {
        // Fallback to direct update if RPC doesn't exist
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            wallet_balance: (walletBalance || 0) - amount 
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
      }
      
      toast.success('Payment successful!');
      onPaymentSuccess();
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleFlutterwavePayment = () => {
    // Simulate Flutterwave payment for now
    toast.success('Flutterwave payment successful!');
    onPaymentSuccess();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-3">Choose Payment Method</h3>
      
      {/* Wallet Payment Option */}
      <Card className={`border-2 transition-colors ${canPayWithWallet ? 'border-green-200 hover:border-green-300' : 'border-gray-200 opacity-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${canPayWithWallet ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Wallet className={`w-5 h-5 ${canPayWithWallet ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`font-medium ${canPayWithWallet ? 'text-gray-900' : 'text-gray-500'}`}>
                  Pay with Wallet
                </p>
                <p className="text-sm text-gray-600">
                  Balance: ₦{walletBalance?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleWalletPayment}
              disabled={!canPayWithWallet}
              className={`text-sm px-4 py-2 ${canPayWithWallet ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Pay ₦{amount.toLocaleString()}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flutterwave Payment Option */}
      <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pay with Card/Bank</p>
                <p className="text-sm text-gray-600">Secure payment via Flutterwave</p>
              </div>
            </div>
            <Button
              onClick={handleFlutterwavePayment}
              className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
            >
              Pay ₦{amount.toLocaleString()}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex justify-between items-center text-gray-600">
          <span>Session Amount:</span>
          <span className="font-medium">₦{amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PaymentSelector;
