
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const RatingReviewPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey(name, profile_image),
          client:users!sessions_client_id_fkey(name, profile_image)
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!rating) {
        throw new Error('Please provide a rating');
      }

      // Submit review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId!,
          reviewer_id: user?.id!,
          rating,
          comment: comment.trim() || null
        });

      if (reviewError) throw reviewError;

      // Trigger escrow settlement if this is an aspirant's review
      if (user?.id === session?.client_id) {
        const { error: settleError } = await supabase.functions.invoke('settle-escrow', {
          body: { sessionId }
        });

        if (settleError) {
          console.error('Escrow settlement error:', settleError);
          // Don't throw error as review was successful
        }
      }
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitReviewMutation.mutateAsync();
    setIsSubmitting(false);
  };

  const isAspirant = user?.id === session?.client_id;
  const otherUser = isAspirant ? session?.student : session?.client;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading session details...</div>
      </div>
    );
  }

  if (submitReviewMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
          <p className="text-gray-600">Your review has been submitted successfully.</p>
          {isAspirant && (
            <p className="text-sm text-green-600 font-medium">
              Payment has been released to the tutor.
            </p>
          )}
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rate Your Session
          </h1>
          <p className="text-gray-600">
            Help improve our platform by sharing your experience
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <img
                  src={otherUser?.profile_image || '/placeholder.svg'}
                  alt={otherUser?.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div>
                <h3 className="font-semibold">{otherUser?.name}</h3>
                <p className="text-sm text-gray-600">
                  {isAspirant ? 'Your Tutor' : 'Your Student'}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">{session?.duration} minutes</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">₦{(session?.amount / 100).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
            {isAspirant && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ This review is required to complete the session and release payment to your tutor.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this session..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rating || isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>

            {isAspirant && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your review will be submitted immediately</li>
                  <li>• Payment will be automatically released to your tutor</li>
                  <li>• The tutor will receive 70% of the session fee</li>
                  <li>• Session will be marked as completed</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RatingReviewPage;
