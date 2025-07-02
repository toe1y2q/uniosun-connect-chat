
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

interface PaymentProcessorProps {
  amount: number;
  sessionData: {
    student_id: string;
    duration: number;
    scheduled_at: string;
    description?: string;
  };
  onSuccess: (sessionId: string) => void;
  onCancel: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  sessionData,
  onSuccess,
  onCancel
}) => {
  const { user, profile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'flutterwave' | null>(null);

  const walletBalance = profile?.wallet_balance || 0;
  const canPayWithWallet = walletBalance >= amount;

  // Flutterwave configuration
  const config = {
    public_key: 'FLWPUBK_TEST-4c0c8ec9f4a5f4c13c5c0b8b5a3b4a7f-X',
    tx_ref: `session_${Date.now()}_${user?.id}`,
    amount: amount / 100,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: profile?.name || '',
    },
    customizations: {
      title: 'UNIOSUN Connect - Session Payment',
      description: `Payment for ${sessionData.duration} minute tutoring session`,
      logo: '',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const processWalletPayment = async () => {
    if (!canPayWithWallet) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setIsProcessing(true);
    setPaymentMethod('wallet');

    try {
      // Create session with wallet payment
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: user?.id,
          student_id: sessionData.student_id,
          amount: amount,
          duration: sessionData.duration,
          scheduled_at: sessionData.scheduled_at,
          description: sessionData.description || '',
          status: 'confirmed',
          payment_status: 'completed'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Record wallet payment transaction
      const { error: paymentTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          session_id: session.id,
          amount: amount,
          type: 'payment',
          status: 'completed',
          description: `Payment for ${sessionData.duration} minute session`,
          reference: `wallet_${Date.now()}`
        });

      if (paymentTransactionError) throw paymentTransactionError;

      // Record student earning transaction
      const { error: earningTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: sessionData.student_id,
          session_id: session.id,
          amount: Math.floor(amount * 0.8), // 80% to student
          type: 'earning',
          status: 'completed',
          description: `Earnings from ${sessionData.duration} minute session`,
          reference: `earning_${Date.now()}`
        });

      if (earningTransactionError) throw earningTransactionError;

      toast.success('Payment successful! Session booked.');
      onSuccess(session.id);
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setPaymentMethod(null);
    }
  };

  const processFlutterwavePayment = () => {
    setPaymentMethod('flutterwave');
    
    handleFlutterPayment({
      callback: async (response) => {
        console.log('Flutterwave response:', response);
        
        if (response.status === 'successful') {
          setIsProcessing(true);
          
          try {
            // Create session with Flutterwave payment
            const { data: session, error: sessionError } = await supabase
              .from('sessions')
              .insert({
                client_id: user?.id,
                student_id: sessionData.student_id,
                amount: amount,
                duration: sessionData.duration,
                scheduled_at: sessionData.scheduled_at,
                description: sessionData.description || '',
                status: 'confirmed',
                payment_status: 'completed',
                flutterwave_reference: response.transaction_id
              })
              .select()
              .single();

            if (sessionError) throw sessionError;

            // Record payment transaction
            const { error: paymentTransactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: user?.id,
                session_id: session.id,
                amount: amount,
                type: 'payment',
                status: 'completed',
                description: `Payment for ${sessionData.duration} minute session`,
                reference: response.transaction_id
              });

            if (paymentTransactionError) throw paymentTransactionError;

            // Record student earning transaction
            const { error: earningTransactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: sessionData.student_id,
                session_id: session.id,
                amount: Math.floor(amount * 0.8), // 80% to student
                type: 'earning',
                status: 'completed',
                description: `Earnings from ${sessionData.duration} minute session`,
                reference: `earning_${response.transaction_id}`
              });

            if (earningTransactionError) throw earningTransactionError;

            toast.success('Payment successful! Session booked.');
            onSuccess(session.id);
          } catch (error) {
            console.error('Flutterwave payment error:', error);
            toast.error('Payment processing failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        } else {
          toast.error('Payment was not successful. Please try again.');
        }
        
        closePaymentModal();
        setPaymentMethod(null);
      },
      onClose: () => {
        console.log('Flutterwave payment modal closed');
        setPaymentMethod(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CreditCard className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Session Duration:</span>
            <span className="font-medium">{sessionData.duration} minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Amount:</span>
            <span className="font-bold text-green-600 text-lg">₦{(amount / 100).toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Your Wallet Balance:</span>
              <span className="font-medium">₦{(walletBalance / 100).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Choose Payment Method</h3>
        
        {/* Wallet Payment Option */}
        <Card 
          className={`border-2 transition-all cursor-pointer ${
            canPayWithWallet 
              ? 'border-green-200 hover:border-green-300 hover:bg-green-50' 
              : 'border-gray-200 opacity-60 cursor-not-allowed'
          }`}
          onClick={canPayWithWallet ? processWalletPayment : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  canPayWithWallet ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {isProcessing && paymentMethod === 'wallet' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : (
                    <Wallet className={`w-5 h-5 ${
                      canPayWithWallet ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${
                    canPayWithWallet ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    Pay from Wallet
                  </p>
                  <p className={`text-sm ${
                    canPayWithWallet ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    Fast and secure payment
                  </p>
                </div>
              </div>
              {canPayWithWallet && (
                <Badge className="bg-green-100 text-green-800">
                  Recommended
                </Badge>
              )}
            </div>
            {!canPayWithWallet && (
              <div className="mt-3 p-2 bg-red-50 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600">
                    Insufficient balance. Need ₦{((amount - walletBalance) / 100).toLocaleString()} more.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flutterwave Payment Option */}
        <Card 
          className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
          onClick={processFlutterwavePayment}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100">
                  {isProcessing && paymentMethod === 'flutterwave' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pay with Card/Bank</p>
                  <p className="text-sm text-gray-600">Secure payment via Flutterwave</p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-600">
                All Cards Accepted
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            if (canPayWithWallet) {
              processWalletPayment();
            } else {
              processFlutterwavePayment();
            }
          }}
          disabled={isProcessing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Pay'
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentProcessor;
