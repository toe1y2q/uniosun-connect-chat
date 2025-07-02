
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Star, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewsListProps {
  studentId?: string;
  showTitle?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ studentId, showTitle = true }) => {
  const { profile } = useAuth();
  const targetId = studentId || profile?.id;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['student-reviews', targetId],
    queryFn: async () => {
      if (!targetId) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          sessions!inner (
            id,
            student_id,
            client:users!sessions_client_id_fkey (name, profile_image)
          )
        `)
        .eq('sessions.student_id', targetId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!targetId
  });

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card className="border-green-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Star className="w-5 h-5" />
            Student Reviews
          </CardTitle>
          <CardDescription>
            Reviews and ratings from your tutoring sessions
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10 border-2 border-green-200">
                    <AvatarImage src={review.sessions?.client?.profile_image} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {review.sessions?.client?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {review.sessions?.client?.name || 'Anonymous'}
                      </h4>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating || 0)}
                        <span className="text-sm text-gray-600 ml-1">
                          ({review.rating || 0}/5)
                        </span>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()} • Session Review
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">
              Complete tutoring sessions to start receiving reviews from students.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsList;
