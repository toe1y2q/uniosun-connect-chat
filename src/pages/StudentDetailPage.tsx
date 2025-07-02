
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Star, Clock, MessageCircle, GraduationCap, MapPin, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import BookingModal from '@/components/booking/BookingModal';
import LoadingSpinner from '@/components/ui/loading-spinner';

const StudentDetailPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch student details
  const { data: student, isLoading } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('id', studentId)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  // Fetch student reviews/ratings
  const { data: reviews } = useQuery({
    queryKey: ['student-reviews', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          sessions!reviews_session_id_fkey (
            client_id,
            users!sessions_client_id_fkey (name)
          )
        `)
        .eq('sessions.student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId
  });

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
    : 0;

  const canBookSession = profile?.role === 'aspirant';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">
        <LoadingSpinner message="Loading student profile..." size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Student not found</h2>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">Student Profile</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Student Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-green-200">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-green-200">
                    <AvatarImage src={student.profile_image} />
                    <AvatarFallback className="bg-green-100 text-green-600 text-xl md:text-2xl">
                      {student.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl md:text-2xl text-gray-900">{student.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4" />
                  {student.departments?.name || 'General Studies'}
                </CardDescription>
                <div className="flex justify-center mt-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Award className="w-3 h-3 mr-1" />
                    Verified Talent
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-sm">Rating</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-green-600">
                    {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reviews?.length || 0} review{reviews?.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-sm">Quiz Score</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-green-600">{student.quiz_score || 0}%</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm">Response</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-blue-600">~2hrs</p>
                  <p className="text-xs text-gray-500">Average</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm">Sessions</span>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-purple-600">15+</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= (review.rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          by {review.sessions?.users?.name || 'Anonymous'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Session Rate */}
            <Card className="border-green-200">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Session Rate</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="text-xl font-bold text-green-600">₦1,000</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Platform fee of 30% applies
                </p>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="pt-4">
              {canBookSession ? (
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Book Session
                </Button>
              ) : (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    {profile?.role === 'student' 
                      ? 'Students can view profiles but cannot book sessions'
                      : 'Only aspirants can book sessions'
                    }
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Browse other talent profiles to learn more
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && student && (
        <BookingModal
          student={student}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
