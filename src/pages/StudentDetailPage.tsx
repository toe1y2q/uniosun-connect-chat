
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Star, Clock, Calendar, GraduationCap, MapPin, MessageCircle, Award } from 'lucide-react';
import BookingModal from '@/components/booking/BookingModal';
import { toast } from 'sonner';

const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch student details (safe public view) + department name
  const { data: student, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: async () => {
      const { data: s, error: sErr } = await supabase
        .from('verified_students_public')
        .select('*')
        .eq('id', id)
        .single();
      if (sErr) throw sErr;
      if (!s) return null;

      const { data: dept, error: dErr } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', s.department_id)
        .maybeSingle();
      if (dErr) throw dErr;

      return {
        ...s,
        departments: { name: dept?.name || 'General Studies' },
      } as any;
    },
    enabled: !!id
  });

  // Fetch reviews for this student
  const { data: reviews } = useQuery({
    queryKey: ['student-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          sessions!inner(student_id),
          reviewer:users!reviews_reviewer_id_fkey(name)
        `)
        .eq('sessions.student_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Calculate average rating
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
    : 0;

  // Simulate response time (in real app, this would come from actual data)
  const responseTime = "< 2 hours";

  const handleBookingSuccess = () => {
    toast.success('Session booked successfully!');
    // Optionally refresh data or navigate
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Student not found</h2>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canBookSession = user && profile?.role === 'aspirant';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Mobile-first layout optimized for iPhone 16 (430x932) */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mb-4 border-green-200 text-green-600 hover:bg-green-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Talents
          </Button>
        </motion.div>

        {/* Student Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 mb-6">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-green-200">
                  <AvatarImage src={student.profile_image} />
                  <AvatarFallback className="bg-green-100 text-green-600 text-2xl md:text-3xl">
                    {student.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl md:text-2xl text-gray-900 mb-2">{student.name}</CardTitle>
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{student.departments?.name || 'General Studies'}</span>
              </div>
              <Badge className="bg-green-100 text-green-800 text-sm">
                <Award className="w-3 h-3 mr-1" />
                Verified Talent
              </Badge>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Quiz Score */}
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-700">Quiz Score</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{student.quiz_score || 0}%</p>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-700">Rating</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl md:text-3xl font-bold text-green-600">
                  {averageRating.toFixed(1)}
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">({reviews?.length || 0} reviews)</p>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">Response Time</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{responseTime}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews Section */}
        {reviews && reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (review.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Book Session Button - Only for Aspirants */}
        {canBookSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto"
          >
            <Button
              onClick={() => setShowBookingModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 md:py-2 text-base md:text-sm font-medium shadow-lg md:shadow-none"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Book Session with {student.name}
            </Button>
          </motion.div>
        )}

        {/* Info for Students */}
        {user && profile?.role === 'student' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
          >
            <p className="text-blue-700">
              You can view talent profiles but only aspirants can book sessions.
            </p>
          </motion.div>
        )}

        {/* Login Prompt for Unauthenticated Users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
          >
            <p className="text-green-700 mb-3">
              Sign up as an aspirant to book sessions with talented students!
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-green-600 hover:bg-green-700"
            >
              Get Started
            </Button>
          </motion.div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          student={student}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
