
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Trophy, CheckCircle, XCircle, RotateCcw, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

const QuizSection = () => {
  const { profile, updateProfile } = useAuth();
  const queryClient = useQueryClient();

  // Check if user can take quiz
  const canTakeQuiz = profile?.is_verified && !profile?.badge;
  const hasPassedQuiz = profile?.badge;
  const needsVerification = !profile?.is_verified;

  // Fetch quiz questions for user's department
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['quiz-questions', profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('department_id', profile.department_id)
        .limit(10);
      
      if (error) throw error;
      
      return data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      })) as Question[];
    },
    enabled: !!profile?.department_id && canTakeQuiz
  });

  // Fetch last quiz attempt
  const { data: lastAttempt } = useQuery({
    queryKey: ['last-quiz-attempt', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Check if user can retry (24 hours after last attempt)
  const canRetry = !lastAttempt || 
    (lastAttempt.next_attempt_at && new Date() > new Date(lastAttempt.next_attempt_at));

  // Loading state
  if (loadingQuestions) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz status display
  return (
    <div className="space-y-4">
      {needsVerification && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 sm:p-6 text-center">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-sm sm:text-base font-semibold mb-2">Verification Pending</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Your account is being verified by our admin team. You'll be able to take the quiz once verified.
            </p>
          </CardContent>
        </Card>
      )}

      {hasPassedQuiz && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 sm:p-6 text-center">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mx-auto mb-4" />
            <h3 className="text-sm sm:text-base font-semibold mb-2">Quiz Completed!</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              You've successfully passed the quiz with a score of {profile.quiz_score}%
            </p>
            <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Verified Talent
            </Badge>
          </CardContent>
        </Card>
      )}

      {canTakeQuiz && !hasPassedQuiz && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              Department Quiz
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Take the quiz to become a verified talent and start receiving bookings on Hireveno
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="text-sm sm:text-lg font-bold text-green-600">10</div>
                <div className="text-xs text-gray-600">Questions</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <div className="text-sm sm:text-lg font-bold text-blue-600">10</div>
                <div className="text-xs text-gray-600">Minutes</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                <div className="text-sm sm:text-lg font-bold text-orange-600">70%</div>
                <div className="text-xs text-gray-600">Pass Score</div>
              </div>
            </div>

            {!canRetry && lastAttempt && (
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto mb-2" />
                <p className="text-xs text-red-600">
                  You can retry after: {new Date(lastAttempt.next_attempt_at!).toLocaleString()}
                </p>
              </div>
            )}

            <Link to="/quiz" className="block">
              <Button
                disabled={!canRetry}
                className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2 sm:py-3"
              >
                {!canRetry ? 'Quiz Attempt Pending' : 'Take Quiz'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizSection;
