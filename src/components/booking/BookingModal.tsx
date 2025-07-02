
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PaymentSelector from './PaymentSelector';

interface Student {
  id: string;
  name: string;
  profile_image?: string;
  quiz_score?: number;
  departments?: {
    name: string;
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

const BookingModal = ({ isOpen, onClose, student }: BookingModalProps) => {
  const { profile } = useAuth();
  const [duration, setDuration] = useState('60');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // Fetch reviews for this student
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
        .eq('sessions.student_id', student.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Calculate average rating
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
    : 0;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    const amount = (parseInt(duration) / 30) * 500; // Fixed pricing calculation

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          client_id: profile?.id,
          student_id: student?.id,
          duration: parseInt(duration),
          scheduled_at: scheduledAt.toISOString(),
          description: description,
          amount: amount, // Store amount in naira, not kobo
          status: 'pending'
        });

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Booking submission error:', error);
    }
  };

  const isStudent = profile?.role === 'student';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student?.profile_image} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
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
                      <Badge className="bg-green-100 text-green-800">
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
                        {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'} 
                        ({reviews?.length || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                        {review.comment && (
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        )}
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
            ) : !showPayment ? (
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
                        <option value="30">30 minutes - ₦500</option>
                        <option value="60">60 minutes - ₦1000</option>
                        <option value="90">90 minutes - ₦1500</option>
                        <option value="120">120 minutes - ₦2000</option>
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
                        <span>₦{(parseInt(duration) / 30) * 500}/session</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>₦{(parseInt(duration) / 30) * 500}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                    Continue to Payment
                  </Button>
                </div>
              </form>
            ) : (
              <PaymentSelector
                amount={(parseInt(duration) / 30) * 500}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => setShowPayment(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
