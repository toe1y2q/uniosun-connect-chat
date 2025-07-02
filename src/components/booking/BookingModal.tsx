
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
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
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

    setStep('payment');
  };

  const handlePaymentSuccess = (newSessionId: string) => {
    setSessionId(newSessionId);
    setStep('success');
  };

  const handleClose = () => {
    setStep('details');
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
            {step === 'success' && 'Booking Successful!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            {/* Student Info */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profile_image} />
                    <AvatarFallback>
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {student.departments?.name}
                      </Badge>
                      {student.quiz_score && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Session Duration (minutes)</Label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="scheduled_at">Date & Time</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Session Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you'd like to cover in this session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        {formData.duration} minutes session
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₦{sessionAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">
                        {formData.duration === 30 ? '₦1,000 for 30 min' : formData.duration === 60 ? '₦1,500 for 60 min' : `₦${Math.round(sessionAmount/formData.duration)} per minute`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
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

        {step === 'success' && (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Session Booked Successfully!
              </h3>
              <p className="text-gray-600">
                Your session with {student.name} has been confirmed.
              </p>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tutor:</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled:</span>
                    <span className="font-medium">
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
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Chat with Tutor
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFinalSuccess}
                className="w-full"
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
