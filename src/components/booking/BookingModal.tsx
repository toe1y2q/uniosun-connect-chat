import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, Star, User, GraduationCap, Award, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PaymentSelector from './PaymentSelector';
import CongratulationsPage from './CongratulationsPage';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

const BookingModal = ({ isOpen, onClose, student }: BookingModalProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState('60');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user's current wallet balance
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const { data: reviews } = useQuery({
    queryKey: ['student-reviews', student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          sessions!inner(student_id)
        `)
        .eq('sessions.student_id', student.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const getSessionAmount = () => {
    const durationInMinutes = parseInt(duration);
    if (durationInMinutes === 30) return 100000; // ₦1,000 in kobo
    if (durationInMinutes === 60) return 150000; // ₦1,500 in kobo
    if (durationInMinutes === 90) return 200000; // ₦2,000 in kobo
    return 100000; // Default to ₦1,000
  };

  const handleWalletPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      const amount = getSessionAmount();
      const currentBalance = userProfile?.wallet_balance || 0;

      console.log('Wallet payment attempt:', {
        amount,
        currentBalance,
        canPay: currentBalance >= amount
      });

      // Check if user has sufficient balance
      if (currentBalance < amount) {
        toast.error('Insufficient wallet balance');
        setIsProcessing(false);
        return;
      }

      // Create session first
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: profile?.id,
          student_id: student?.id,
          duration: parseInt(duration),
          scheduled_at: scheduledAt.toISOString(),
          description: description,
          amount: amount,
          status: 'confirmed' // Automatically confirm for successful payments
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update user's wallet balance
      const newBalance = currentBalance - amount;
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          wallet_balance: newBalance 
        })
        .eq('id', profile?.id);

      if (walletError) throw walletError;

      // Create payment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile?.id,
          type: 'payment',
          amount: amount,
          session_id: session.id,
          status: 'completed',
          description: `Session payment to ${student.name}`
        });

      if (transactionError) throw transactionError;

      // Create earning transaction for the student
      const { error: earningError } = await supabase
        .from('transactions')
        .insert({
          user_id: student.id,
          type: 'earning',
          amount: amount,
          session_id: session.id,
          status: 'completed',
          description: `Session earning from ${profile?.name}`
        });

      if (earningError) throw earningError;

      // Refresh user profile data
      queryClient.invalidateQueries({ queryKey: ['user-profile', profile?.id] });

      setSessionData({ ...session, student });
      setShowCongratulations(true);
      toast.success('Payment successful! Session booked.');
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlutterwavePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      const amount = getSessionAmount();

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: profile?.id,
          student_id: student?.id,
          duration: parseInt(duration),
          scheduled_at: scheduledAt.toISOString(),
          description: description,
          amount: amount,
          status: 'confirmed' // Automatically confirm for successful payments
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create payment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile?.id,
          type: 'payment',
          amount: amount,
          session_id: session.id,
          status: 'completed',
          description: `Session payment to ${student.name}`,
          reference: `FLW_${Date.now()}`
        });

      if (transactionError) throw transactionError;

      // Create earning transaction for the student
      const { error: earningError } = await supabase
        .from('transactions')
        .insert({
          user_id: student.id,
          type: 'earning',
          amount: amount,
          session_id: session.id,
          status: 'completed',
          description: `Session earning from ${profile?.name}`
        });

      if (earningError) throw earningError;

      setSessionData({ ...session, student });
      setShowCongratulations(true);
      toast.success('Payment successful! Session booked.');
    } catch (error) {
      console.error('Flutterwave payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToChat = () => {
    if (sessionData) {
      navigate(`/chat/${sessionData.id}`);
      onClose();
    }
  };

  const handleGenerateReceipt = () => {
    const receiptData = {
      sessionId: sessionData.id,
      studentName: sessionData.student.name,
      duration: sessionData.duration,
      amount: sessionData.amount,
      date: new Date(sessionData.scheduled_at),
      aspirantName: profile?.name
    };
    
    const receipt = `
HIREVENO TUTORING RECEIPT
========================
Session ID: ${receiptData.sessionId}
Tutor: ${receiptData.studentName}
Student: ${receiptData.aspirantName}
Duration: ${receiptData.duration} minutes
Amount: ₦${(receiptData.amount / 100).toLocaleString()}
Date: ${receiptData.date.toLocaleDateString()}
Time: ${receiptData.date.toLocaleTimeString()}
========================
Thank you for choosing Hireveno!
    `;
    
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hireveno-receipt-${receiptData.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isStudent = profile?.role === 'student';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student?.profile_image} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {student?.name?.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{student?.name}</h3>
              <p className="text-sm text-gray-600">{student?.departments?.name}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isStudent ? 'View tutor profile' : 'Book a session with this verified UNIOSUN student'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="booking" disabled={isStudent}>
              {isStudent ? 'Booking Disabled' : 'Book Session'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-gray-900">{student?.departments?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quiz Score</label>
                    <p className="mt-1 text-gray-900">{student?.quiz_score}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Verified Student
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        <Award className="w-3 h-3 mr-1" />
                        Certified Tutor
                      </Badge>
                    </div>
                  </div>
                   <div>
                     <label className="text-sm font-medium text-gray-700">Rating</label>
                     <div className="mt-1 flex items-center gap-1">
                       <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                       <span className="text-gray-900">
                         {reviews && reviews.length > 0 
                           ? `${(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)} (${reviews.length} reviews)`
                           : 'No reviews yet'
                         }
                       </span>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            {isStudent ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Booking Restricted</h3>
                  <p className="text-yellow-700">
                    Students cannot book sessions with other students. Only aspirants can book tutoring sessions.
                  </p>
                </CardContent>
              </Card>
            ) : showCongratulations ? (
              <CongratulationsPage
                sessionData={sessionData}
                onProceedToChat={handleProceedToChat}
                onGenerateReceipt={handleGenerateReceipt}
                onClose={onClose}
              />
            ) : showPayment ? (
              <PaymentSelector
                walletBalance={userProfile?.wallet_balance || 0}
                sessionAmount={getSessionAmount()}
                onWalletPayment={handleWalletPayment}
                onFlutterwavePayment={handleFlutterwavePayment}
                isProcessing={isProcessing}
              />
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                    <CardDescription>
                      Choose your session duration and schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="30">30 minutes - ₦1,000</option>
                        <option value="60">60 minutes - ₦1,500</option>
                        <option value="90">90 minutes - ₦2,000</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Preferred Date
                        </label>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Preferred Time
                        </label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Session Description (Optional)
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what you'd like to learn or any specific topics you want to cover..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Session Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>₦{(getSessionAmount() / 100).toLocaleString()}/session</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>₦{(getSessionAmount() / 100).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Continue to Payment
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
