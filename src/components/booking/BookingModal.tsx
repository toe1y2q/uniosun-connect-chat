
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initializeFlutterwavePayment, generateTxRef } from '@/utils/flutterwave';
import PaymentSelector from './PaymentSelector';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    email: string;
    flutterwave_subaccount_id?: string;
  };
  onAuthRequired?: () => void;
}

const BookingModal = ({ isOpen, onClose, student, onAuthRequired }: BookingModalProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: '60',
    amount: 1500 // 1 hour = 1500, will be updated based on duration
  });

  // Update amount based on duration
  React.useEffect(() => {
    const duration = parseInt(bookingData.duration);
    let newAmount = 1500; // Default 1 hour
    
    if (duration === 30) {
      newAmount = 1000; // 30 minutes
    } else if (duration === 60) {
      newAmount = 1500; // 1 hour
    } else if (duration === 90) {
      newAmount = 2250; // 1.5 hours
    } else if (duration === 120) {
      newAmount = 3000; // 2 hours
    }
    
    setBookingData(prev => ({ ...prev, amount: newAmount }));
  }, [bookingData.duration]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Fetch user's wallet balance
  const { data: userWallet } = useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Session booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  });

  const handleContinueToPayment = () => {
    if (!user || !profile) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        toast.error('Please log in to book a session');
      }
      return;
    }

    if (!bookingData.date || !bookingData.time) {
      toast.error('Please select date and time');
      return;
    }

    setShowPaymentOptions(true);
  };

  const handleWalletPayment = async () => {
    if (!user || !profile) return;

    const walletBalance = userWallet?.wallet_balance || 0;
    const sessionAmountInKobo = bookingData.amount * 100;

    if (walletBalance < sessionAmountInKobo) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setIsProcessing(true);

    try {
      const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`).toISOString();
      const txRef = generateTxRef();

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('users')
        .update({ wallet_balance: walletBalance - sessionAmountInKobo })
        .eq('id', user.id);

      if (walletError) throw walletError;

      // Create session record
      const sessionData = {
        client_id: user.id,
        student_id: student.id,
        scheduled_at: scheduledAt,
        duration: parseInt(bookingData.duration),
        amount: sessionAmountInKobo,
        payment_status: 'completed',
        status: 'confirmed',
        flutterwave_reference: txRef
      };

      createSessionMutation.mutate(sessionData);

      // Create transactions
      await Promise.all([
        // Payment transaction for aspirant
        supabase.from('transactions').insert({
          user_id: user.id,
          amount: -sessionAmountInKobo,
          type: 'payment',
          status: 'completed',
          reference: txRef,
          description: `Session payment to ${student.name}`
        }),
        // Earning transaction for student
        supabase.from('transactions').insert({
          user_id: student.id,
          amount: Math.floor(sessionAmountInKobo * 0.7), // 70% in kobo
          type: 'earning',
          status: 'completed',
          reference: txRef,
          description: `Session earning from ${profile.name}`
        })
      ]);

      toast.success('Payment successful! Session booked.');
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlutterwavePayment = async () => {
    if (!user || !profile) return;

    setIsProcessing(true);

    try {
      const txRef = generateTxRef();
      const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`).toISOString();
      
      const paymentData = {
        amount: bookingData.amount,
        email: user.email!,
        name: profile.name,
        tx_ref: txRef,
        redirect_url: window.location.origin + '/dashboard',
        subaccounts: student.flutterwave_subaccount_id ? [{
          id: student.flutterwave_subaccount_id,
          transaction_split_ratio: 70 // 70% to student
        }] : undefined
      };

      const response = await initializeFlutterwavePayment(paymentData);
      
      if (response && (response as any).status === 'successful') {
        // Create session record
        const sessionData = {
          client_id: user.id,
          student_id: student.id,
          scheduled_at: scheduledAt,
          duration: parseInt(bookingData.duration),
          amount: bookingData.amount * 100, // Convert to kobo
          payment_status: 'completed',
          status: 'confirmed',
          flutterwave_reference: (response as any).transaction_id
        };

        createSessionMutation.mutate(sessionData);

        // Create earning transaction for student
        await supabase.from('transactions').insert({
          user_id: student.id,
          amount: Math.floor(bookingData.amount * 0.7 * 100), // 70% in kobo
          type: 'earning',
          status: 'completed',
          reference: (response as any).transaction_id,
          description: `Session earning from ${profile.name}`
        });

      } else {
        toast.error('Payment was not successful');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Book Session with {student.name}
          </DialogTitle>
          <DialogDescription>
            Schedule a 1-on-1 learning session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showPaymentOptions ? (
            <>
              {/* Session Details Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={bookingData.duration} 
                  onValueChange={(value) => setBookingData({...bookingData, duration: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Session Fee:</span>
                  <span className="text-lg font-bold">₦{bookingData.amount.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Student receives: ₦{Math.floor(bookingData.amount * 0.7).toLocaleString()} (70%)</p>
                  <p>• Platform fee: ₦{Math.floor(bookingData.amount * 0.3).toLocaleString()} (30%)</p>
                  <p>• Duration: {bookingData.duration} minutes</p>
                </div>
              </div>

              <Button 
                onClick={handleContinueToPayment}
                disabled={!bookingData.date || !bookingData.time}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue to Payment
              </Button>
            </>
          ) : (
            <>
              {/* Payment Options */}
              <PaymentSelector
                walletBalance={userWallet?.wallet_balance || 0}
                sessionAmount={bookingData.amount * 100} // Convert to kobo
                onWalletPayment={handleWalletPayment}
                onFlutterwavePayment={handleFlutterwavePayment}
                isProcessing={isProcessing}
              />
              
              <Button 
                onClick={() => setShowPaymentOptions(false)}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                Back to Session Details
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
