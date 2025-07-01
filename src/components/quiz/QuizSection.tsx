
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

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
        .limit(15);
      
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
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Check if user can retry (24 hours after last attempt)
  const canRetry = !lastAttempt || 
    (lastAttempt.next_attempt_at && new Date() > new Date(lastAttempt.next_attempt_at));

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async ({ score, passed }: { score: number; passed: boolean }) => {
      if (!profile?.id || !profile?.department_id) throw new Error('Missing user data');

      // Insert quiz attempt
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: profile.id,
          department_id: profile.department_id,
          score,
          total_questions: questions?.length || 15,
          passed,
          next_attempt_at: passed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (attemptError) throw attemptError;

      // Update user profile if passed
      if (passed) {
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            quiz_score: score,
            badge: true 
          })
          .eq('id', profile.id);

        if (userError) throw userError;
      }

      return { score, passed };
    },
    onSuccess: (data) => {
      setQuizScore(data.score);
      setShowResults(true);
      setIsQuizActive(false);
      
      if (data.passed) {
        toast({
          title: "🎉 Congratulations!",
          description: "You've passed the quiz and earned your badge! You can now receive session bookings.",
        });
        updateProfile({ quiz_score: data.score, badge: true });
      } else {
        toast({
          title: "Quiz Completed",
          description: "You can retry after 24 hours. Keep studying!",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['last-quiz-attempt'] });
    },
    onError: (error) => {
      console.error('Quiz submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isQuizActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isQuizActive, timeLeft]);

  const startQuiz = () => {
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setTimeLeft(900);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!questions) return;
    
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return answer === questions[index]?.correct_answer ? count + 1 : count;
    }, 0);
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;
    
    submitQuizMutation.mutate({ score, passed });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Show results
  if (showResults) {
    const passed = quizScore >= 70;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <Card className={`border-2 ${passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {passed ? (
                <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              )}
            </motion.div>
            
            <h2 className="text-lg font-bold mb-4">
              {passed ? '🎉 Congratulations!' : 'Quiz Completed'}
            </h2>
            
            <div className="text-3xl font-bold mb-4">
              <span className={passed ? 'text-green-600' : 'text-red-600'}>
                {quizScore}%
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              {passed 
                ? "You've earned your badge and can now receive bookings!"
                : "You need 70% to pass. You can retry in 24 hours."
              }
            </p>
            
            {passed && (
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                <Award className="w-4 h-4 mr-2" />
                Verified Talent
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Quiz interface
  if (isQuizActive && questions) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="space-y-4">
        {/* Timer and Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm">
                  Time Left: {formatTime(timeLeft)}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base leading-tight">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                      className="w-full text-left justify-start p-3 h-auto whitespace-normal text-sm"
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswers[currentQuestionIndex] === index 
                            ? 'bg-green-600 border-green-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswers[currentQuestionIndex] === index && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{option}</span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto text-sm"
                size="sm"
              >
                Previous
              </Button>
              
              <div className="text-xs text-gray-600 text-center order-first sm:order-none">
                {selectedAnswers.filter(a => a !== undefined).length} / {questions.length} answered
              </div>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={selectedAnswers.filter(a => a !== undefined).length !== questions.length}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
                  size="sm"
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  className="w-full sm:w-auto text-sm"
                  size="sm"
                >
                  Next
                </Button>
              )}
            </div>
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
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-2">Verification Pending</h3>
            <p className="text-sm text-gray-600">
              Your account is being verified by our admin team. You'll be able to take the quiz once verified.
            </p>
          </CardContent>
        </Card>
      )}

      {hasPassedQuiz && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Trophy className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-2">Quiz Completed!</h3>
            <p className="text-sm text-gray-600 mb-4">
              You've successfully passed the quiz with a score of {profile.quiz_score}%
            </p>
            <Badge className="bg-green-100 text-green-800 text-sm">
              <Award className="w-4 h-4 mr-1" />
              Verified Talent
            </Badge>
          </CardContent>
        </Card>
      )}

      {canTakeQuiz && !hasPassedQuiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Department Quiz
            </CardTitle>
            <CardDescription className="text-sm">
              Take the quiz to become a verified talent and start receiving bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">10</div>
                <div className="text-xs text-gray-600">Questions</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">10</div>
                <div className="text-xs text-gray-600">Minutes</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">70%</div>
                <div className="text-xs text-gray-600">Pass Score</div>
              </div>
            </div>

            {!canRetry && lastAttempt && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <RotateCcw className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-xs text-red-600">
                  You can retry after: {new Date(lastAttempt.next_attempt_at!).toLocaleString()}
                </p>
              </div>
            )}

            <Link to="/quiz" className="block">
              <Button
                disabled={!canRetry || !questions?.length}
                className="w-full bg-green-600 hover:bg-green-700 text-sm"
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
