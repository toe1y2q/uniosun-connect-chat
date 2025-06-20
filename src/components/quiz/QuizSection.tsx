
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, X, Award, Clock, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuizResult {
  score: number;
  passed: boolean;
}

interface QuizSubmission {
  answers: number[];
  questions: any[];
}

const QuizSection = () => {
  const { profile, updateProfile } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState<any[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

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
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const { data: questions } = useQuery({
    queryKey: ['quiz-questions', profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('department_id', profile.department_id);
      
      if (error) throw error;
      
      // Shuffle and take 15 questions
      const shuffled = data.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 15);
    },
    enabled: !!profile?.department_id && !profile?.badge
  });

  const submitQuizMutation = useMutation<QuizResult, Error, QuizSubmission>({
    mutationFn: async ({ answers, questions }) => {
      if (!profile?.id || !profile?.department_id) {
        throw new Error('User profile not found');
      }

      const score = answers.reduce((acc, answer, index) => {
        return acc + (answer === questions[index].correct_answer ? 1 : 0);
      }, 0);
      
      const percentage = Math.round((score / questions.length) * 100);
      const passed = percentage >= 70;

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: profile.id,
          department_id: profile.department_id,
          score: percentage,
          total_questions: questions.length,
          passed,
          next_attempt_at: passed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (attemptError) throw attemptError;

      if (passed) {
        await updateProfile({ 
          quiz_score: percentage, 
          badge: true 
        });
      } else {
        await updateProfile({ quiz_score: percentage });
      }

      return { score: percentage, passed };
    },
    onSuccess: (result) => {
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ['last-quiz-attempt'] });
      
      if (result.passed) {
        toast({
          title: '🎉 Congratulations!',
          description: `You scored ${result.score}% and earned your badge!`
        });
      } else {
        toast({
          title: 'Quiz Failed',
          description: `You scored ${result.score}%. Try again in 24 hours.`,
          variant: 'destructive'
        });
      }
    }
  });

  const startQuiz = () => {
    if (questions) {
      setCurrentQuiz(questions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setSelectedAnswer(null);
      setShowResults(false);
    }
  };

  const nextQuestion = () => {
    if (selectedAnswer === null || !currentQuiz) return;
    
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed
      submitQuizMutation.mutate({ 
        answers: newAnswers, 
        questions: currentQuiz 
      });
    }
  };

  const canTakeQuiz = () => {
    if (!profile?.is_verified) return false;
    if (profile?.badge) return false;
    if (!lastAttempt) return true;
    
    if (!lastAttempt.next_attempt_at) return false;
    const nextAttemptTime = new Date(lastAttempt.next_attempt_at);
    return new Date() > nextAttemptTime;
  };

  const getTimeUntilNextAttempt = () => {
    if (!lastAttempt?.next_attempt_at) return null;
    
    const nextAttemptTime = new Date(lastAttempt.next_attempt_at);
    const now = new Date();
    const diff = nextAttemptTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (!profile?.is_verified) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Waiting for Verification</h3>
          <p className="text-gray-600">Your account needs to be verified by an admin before you can take the quiz.</p>
        </CardContent>
      </Card>
    );
  }

  if (profile?.badge) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quiz Completed!</h3>
          <p className="text-gray-600 mb-4">
            You scored {profile.quiz_score}% and earned your verified badge!
          </p>
          <Badge className="bg-green-100 text-green-800">
            <Award className="w-4 h-4 mr-1" />
            Verified Talent
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (currentQuiz && !showResults) {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">UNIOSUN Knowledge Quiz</h2>
            <Badge variant="outline">
              {currentQuestionIndex + 1} of {currentQuiz.length}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option: string, index: number) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === index
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 border-2 ${
                        selectedAnswer === index
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      {option}
                    </div>
                  </motion.button>
                ))}
                
                <Button 
                  onClick={nextQuestion}
                  disabled={selectedAnswer === null}
                  className="w-full mt-6"
                >
                  {currentQuestionIndex === currentQuiz.length - 1 ? 'Submit Quiz' : 'Next Question'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            UNIOSUN Knowledge Quiz
          </CardTitle>
          <CardDescription>
            Pass this 15-question quiz with 70% or higher to earn your verified badge and start receiving bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastAttempt && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Last Attempt</h4>
              <div className="flex items-center justify-between">
                <span>Score: {lastAttempt.score}%</span>
                <Badge className={lastAttempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {lastAttempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
              {!lastAttempt.passed && getTimeUntilNextAttempt() && (
                <p className="text-sm text-gray-600 mt-2">
                  Next attempt available in: {getTimeUntilNextAttempt()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>15 randomly selected questions about UNIOSUN</li>
                <li>70% minimum score required to pass</li>
                <li>If you fail, you can retry after 24 hours</li>
                <li>Passing unlocks your verified badge</li>
              </ul>
            </div>
            
            <Button 
              onClick={startQuiz}
              disabled={!canTakeQuiz() || !questions?.length}
              className="w-full"
            >
              {!canTakeQuiz() && getTimeUntilNextAttempt() ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Try again in {getTimeUntilNextAttempt()}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizSection;
