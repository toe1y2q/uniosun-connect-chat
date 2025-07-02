import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionData {
  studentId: string;
  duration: number;
  scheduledAt: string;
  description?: string;
}

interface WalletPaymentProps {
  sessionData: SessionData;
  onSuccess: (sessionId: string) => void;
  onCancel?: () => void;
}

const WalletPayment: React.FC<WalletPaymentProps> = ({
  sessionData,
  onSuccess,
  onCancel
}) => {
  const { user, profile } = useAuth();

  // Calculate amount based on duration
  const getAmount = (duration: number) => {
    return duration === 30 ? 1000 : duration === 60 ? 1500 : duration * 25;
  };

  const amount = getAmount(sessionData.duration);
  const walletBalance = profile?.wallet_balance || 0;
  const hasEnoughBalance = walletBalance >= amount * 100; // Convert to kobo

  const handleWalletPayment = async () => {
    if (!user || !profile) {
      toast.error('Please log in to make payment');
      return;
    }

    if (!hasEnoughBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    try {
      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: user.id,
          student_id: sessionData.studentId,
          duration: sessionData.duration,
          amount: amount * 100, // Store in kobo
          scheduled_at: sessionData.scheduledAt,
          status: 'confirmed',
          payment_status: 'completed',
          description: sessionData.description || `${sessionData.duration} minute tutoring session`
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }

      // Create payment transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          session_id: session.id,
          amount: amount * 100, // Store in kobo
          type: 'payment',
          status: 'completed',
          reference: `wallet_${Date.now()}`,
          description: `Wallet payment for ${sessionData.duration} minute tutoring session`
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }

      toast.success('Payment successful! Session booked.');
      onSuccess(session.id);
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Failed to process wallet payment. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center">
          <Wallet className="w-5 h-5 text-green-600" />
          Pay with Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">₦{amount.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{sessionData.duration} minute session</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{sessionData.duration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>₦{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>Wallet Balance</span>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className={`${hasEnoughBalance ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Current Balance:</span>
              </div>
              <div className="text-right">
                <div className="font-bold">₦{(walletBalance / 100).toLocaleString()}</div>
                {hasEnoughBalance ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sufficient
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Insufficient
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasEnoughBalance && (
          <div className="bg-red-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-red-800">Insufficient Balance</p>
            <p className="text-red-600">
              You need ₦{((amount * 100 - walletBalance) / 100).toLocaleString()} more to complete this payment.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleWalletPayment}
            disabled={!hasEnoughBalance}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {hasEnoughBalance ? `Pay ₦${amount.toLocaleString()}` : 'Insufficient Balance'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletPayment;