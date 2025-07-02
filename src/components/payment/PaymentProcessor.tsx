
import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface SessionData {
  studentId: string;
  duration: number;
  scheduledAt: string;
  description?: string;
}

interface PaymentProcessorProps {
  sessionData: SessionData;
  onSuccess: (sessionId: string) => void;
  onCancel?: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  sessionData,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();

  // Calculate amount based on duration
  const getAmount = (duration: number) => {
    return duration === 30 ? 1000 : duration === 60 ? 1500 : duration * 25; // ₦1,000 for 30 min, ₦1,500 for 60 min
  };

  const amount = getAmount(sessionData.duration);

  if (!user) {
    return <div>Please log in to make payment</div>;
  }

  const config = {
    public_key: 'FLWPUBK-08518f8d77cbc2a7fbdd880c432bd85f-X',
    tx_ref: `session_${Date.now()}_${user.id}`,
    amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user.email,
      phone_number: '',
      name: user.email,
    },
    customizations: {
      title: 'Tutoring Session Payment',
      description: `Payment for ${sessionData.duration} minute tutoring session`,
      logo: '',
    },
    meta: {
      rave_escrow_tx: '1',
      session_type: 'tutoring',
      duration: sessionData.duration.toString()
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    handleFlutterPayment({
      callback: async (response) => {
        console.log('Payment response:', response);
        
        if (response.status === 'successful') {
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
                flutterwave_reference: response.flw_ref,
                description: sessionData.description || `${sessionData.duration} minute tutoring session`
              })
              .select()
              .single();

            if (sessionError) {
              console.error('Session creation error:', sessionError);
              throw sessionError;
            }

            // Create transaction record
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                session_id: session.id,
                amount: amount * 100, // Store in kobo
                type: 'payment',
                status: 'completed',
                reference: response.flw_ref,
                description: `Payment for ${sessionData.duration} minute tutoring session`
              });

            if (transactionError) {
              console.error('Transaction creation error:', transactionError);
              throw transactionError;
            }

            toast.success('Payment successful! Session booked.');
            onSuccess(session.id);
          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error('Failed to process payment. Please contact support.');
          }
        } else {
          toast.error('Payment failed or was cancelled');
          onCancel?.();
        }
        
        closePaymentModal();
      },
      onClose: () => {
        console.log('Payment modal closed');
        onCancel?.();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Complete Payment</CardTitle>
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
            <span>Flutterwave (Escrow)</span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <p className="font-medium text-blue-800">Secure Escrow Payment</p>
          <p className="text-blue-600">
            Your payment is held securely until the session is completed and reviewed.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Pay ₦{amount.toLocaleString()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentProcessor;
