
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const RatingReviewPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['session-details', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (id, name, profile_image, departments(name))
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId
  });

  // Check if review already exists
  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', sessionId],
    queryFn: async () => {
      if (!sessionId || !profile?.id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('reviewer_id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!profile?.id
  });

  const handleSubmitReview = async () => {
    if (!rating || !sessionId || !profile?.id) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId,
          reviewer_id: profile.id,
          rating: rating,
          comment: comment.trim() || null
        });

      if (reviewError) throw reviewError;

      // Update session status to completed
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['session-details', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['existing-review', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['aspirant-sessions'] });

      toast.success('Review submitted successfully!');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">The session you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Already Submitted</h1>
            <p className="text-gray-600">You've already reviewed this session. Thank you for your feedback!</p>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= existingReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {existingReview.comment && (
                <div>
                  <span className="text-sm font-medium">Comment:</span>
                  <p className="text-gray-700 mt-1">{existingReview.comment}</p>
                </div>
              )}
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Experience</h1>
          <p className="text-gray-600">How was your tutoring session with {session.student.name}?</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-semibold">
                  {session.student.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{session.student.name}</h3>
                <p className="text-sm text-gray-600">{session.student.departments?.name}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this session? *
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience (optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell other aspirants about your experience with this tutor..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
                disabled={isSubmitting}
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={!rating || isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RatingReviewPage;
