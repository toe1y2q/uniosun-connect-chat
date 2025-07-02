
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CreditCard, Wallet } from 'lucide-react';
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
    amount: profile?.role === 'aspirant' ? 1000 : 1500
  });
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'flutterwave'>('flutterwave');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user's wallet balance
  const { data: walletBalance = 0 } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.wallet_balance || 0;
    },
    enabled: !!user?.id
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
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  });

  const handleWalletPayment = async () => {
    if (!user || !profile) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        toast.error('Please log in to book a session');
      }
      return;
    }

    if (walletBalance < bookingData.amount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setIsProcessing(true);

    try {
      const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`).toISOString();
      
      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          wallet_balance: walletBalance - bookingData.amount 
        })
        .eq('id', user.id);

      if (walletError) throw walletError;

      // Create session record
      const sessionData = {
        client_id: user.id,
        student_id: student.id,
        scheduled_at: scheduledAt,
        duration: parseInt(bookingData.duration),
        amount: bookingData.amount * 100, // Convert to kobo
        payment_status: 'completed',
        status: 'confirmed'
      };

      createSessionMutation.mutate(sessionData);

      // Create earning transaction for student
      await supabase.from('transactions').insert({
        user_id: student.id,
        amount: Math.floor(bookingData.amount * 0.7 * 100), // 70% in kobo
        type: 'earning',
        status: 'completed',
        description: `Session earning from ${profile.name}`
      });

      // Create payment transaction for client
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: bookingData.amount * 100, // Convert to kobo
        type: 'payment',
        status: 'completed',
        description: `Session payment to ${student.name}`
      });

    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlutterwavePayment = async () => {
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

  const handlePayment = () => {
    if (paymentMethod === 'wallet') {
      handleWalletPayment();
    } else {
      handleFlutterwavePayment();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Book Session with {student.name}
          </DialogTitle>
          <DialogDescription>
            Schedule a 1-on-1 learning session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-sm">Time</Label>
              <Input
                id="time"
                type="time"
                value={bookingData.time}
                onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                className="h-11"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration" className="text-sm">Duration</Label>
            <Select 
              value={bookingData.duration} 
              onValueChange={(value) => setBookingData({...bookingData, duration: value})}
            >
              <SelectTrigger className="h-11">
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

          <PaymentSelector
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            walletBalance={Math.floor(walletBalance / 100)} // Convert from kobo
            sessionAmount={bookingData.amount}
          />

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
            onClick={handlePayment}
            disabled={
              isProcessing || 
              !bookingData.date || 
              !bookingData.time ||
              (paymentMethod === 'wallet' && walletBalance < bookingData.amount * 100)
            }
            className="w-full bg-green-600 hover:bg-green-700 h-12"
          >
            {paymentMethod === 'wallet' ? (
              <Wallet className="w-4 h-4 mr-2" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processing Payment...' : `Pay ₦${bookingData.amount.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
