
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, User, Star, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import PaymentProcessor from '@/components/payment/PaymentProcessor';
import WalletPayment from '@/components/payment/WalletPayment';

interface Student {
  id: string;
  name: string;
  profile_image?: string;
  departments?: { name: string };
  quiz_score?: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onBookingSuccess: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  student,
  onBookingSuccess
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'wallet' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'wallet'>('flutterwave');
  const [formData, setFormData] = useState({
    duration: 30,
    scheduled_at: '',
    description: ''
  });
  const [sessionId, setSessionId] = useState<string>('');

  const handleNext = () => {
    if (!formData.scheduled_at) {
      toast.error('Please select a date and time for your session');
      return;
    }

    const selectedDateTime = new Date(formData.scheduled_at);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      toast.error('Please select a future date and time');
      return;
    }

    if (paymentMethod === 'wallet') {
      setStep('wallet');
    } else {
      setStep('payment');
    }
  };

  const handlePaymentSuccess = (newSessionId: string) => {
    setSessionId(newSessionId);
    setStep('success');
  };

  const handleClose = () => {
    setStep('details');
    setPaymentMethod('flutterwave');
    setFormData({
      duration: 30,
      scheduled_at: '',
      description: ''
    });
    setSessionId('');
    onClose();
  };

  const handleFinalSuccess = () => {
    handleClose();
    onBookingSuccess();
    toast.success('Session booked successfully!');
  };

  const getSessionAmount = (duration: number) => {
    return duration === 30 ? 1000 : duration === 60 ? 1500 : duration * 25;
  };
  
  const sessionAmount = getSessionAmount(formData.duration);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            {step === 'details' && 'Book a Session'}
            {step === 'payment' && 'Complete Payment'}
            {step === 'wallet' && 'Pay with Wallet'}
            {step === 'success' && 'Booking Successful!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Student Info */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={student.profile_image} />
                    <AvatarFallback>
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">{student.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge variant="outline" className="text-xs w-fit">
                        {student.departments?.name}
                      </Badge>
                      {student.quiz_score && (
                        <Badge className="bg-green-100 text-green-800 text-xs w-fit">
                          {student.quiz_score}% Quiz Score
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Booking Form */}
            <div className="space-y-4">
              {/* Duration and Date/Time - Stack on mobile */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Session Duration
                  </Label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_at" className="text-sm font-medium">
                    Date & Time
                  </Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Session Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you'd like to cover in this session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none text-sm"
                  rows={3}
                />
              </div>

              {/* Payment Method Selection */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 sm:p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 text-sm sm:text-base">
                    Select Payment Method
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="flutterwave"
                        checked={paymentMethod === 'flutterwave'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'flutterwave' | 'wallet')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Card/Bank Payment (Flutterwave)</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="wallet"
                        checked={paymentMethod === 'wallet'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'flutterwave' | 'wallet')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Wallet Balance</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700">
                        {formData.duration} minutes session
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₦{sessionAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">
                        {formData.duration === 30 ? '₦1,000 for 30 min' : 
                         formData.duration === 60 ? '₦1,500 for 60 min' : 
                         `₦${Math.round(sessionAmount/formData.duration)} per minute`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1 bg-green-600 hover:bg-green-700 order-1 sm:order-2"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <PaymentProcessor
            sessionData={{
              studentId: student.id,
              duration: formData.duration,
              scheduledAt: formData.scheduled_at,
              description: formData.description
            }}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep('details')}
          />
        )}

        {step === 'wallet' && (
          <WalletPayment
            sessionData={{
              studentId: student.id,
              duration: formData.duration,
              scheduledAt: formData.scheduled_at,
              description: formData.description
            }}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep('details')}
          />
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Session Booked Successfully!
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Your session with {student.name} has been confirmed.
              </p>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tutor:</span>
                    <span className="font-medium text-right">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled:</span>
                    <span className="font-medium text-right">
                      {new Date(formData.scheduled_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-600">
                      ₦{sessionAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = `/chat/${sessionId}`}
                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base"
              >
                Start Chat with Tutor
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFinalSuccess}
                className="w-full text-sm sm:text-base"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
