
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, X, Award, Clock, RefreshCw, BookOpen, Trophy, Zap } from 'lucide-react';
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
  const [quizStarted, setQuizStarted] = useState(false);
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
          description: `You scored ${result.score}% and earned your verified badge!`
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
      setQuizStarted(true);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Clock className="w-full h-full text-amber-500" />
            </motion.div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Verification in Progress</h3>
            <p className="text-gray-600 leading-relaxed">
              Your JAMB registration is being verified by our admin team. 
              This usually takes 1-2 business days. Once verified, you'll be able to take the quiz!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (profile?.badge) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
            >
              <Trophy className="w-10 h-10 text-green-600" />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-green-800">Quiz Mastered! 🎓</h3>
              <p className="text-green-700 mb-4 text-lg">
                You scored {profile.quiz_score}% and earned your verified badge!
              </p>
              <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
                <Award className="w-4 h-4 mr-2" />
                Verified UNIOSUN Talent
              </Badge>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (currentQuiz && !showResults) {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <motion.h2 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-2xl font-bold text-gray-800"
            >
              UNIOSUN Knowledge Quiz
            </motion.h2>
            <Badge variant="outline" className="px-3 py-1">
              {currentQuestionIndex + 1} of {currentQuiz.length}
            </Badge>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <motion.div 
              className="absolute right-0 -top-8 text-sm font-medium text-indigo-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Math.round(progress)}%
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg leading-relaxed text-gray-800">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option: string, index: number) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
                      selectedAnswer === index
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full mr-4 border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4"
                >
                  <Button 
                    onClick={nextQuestion}
                    disabled={selectedAnswer === null}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex === currentQuiz.length - 1 ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Submit Quiz
                      </>
                    ) : (
                      <>
                        Next Question
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="ml-2"
                        >
                          →
                        </motion.div>
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <BookOpen className="w-6 h-6" />
            UNIOSUN Knowledge Quiz
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Test your knowledge about UNIOSUN to earn your verified badge and start receiving bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {lastAttempt && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-lg"
            >
              <h4 className="font-semibold mb-2 text-gray-800">Previous Attempt</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Score: {lastAttempt.score}%</span>
                <Badge className={lastAttempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {lastAttempt.passed ? 'Passed ✓' : 'Failed ✗'}
                </Badge>
              </div>
              {!lastAttempt.passed && getTimeUntilNextAttempt() && (
                <p className="text-sm text-amber-600 mt-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Next attempt in: {getTimeUntilNextAttempt()}
                </p>
              )}
            </motion.div>
          )}

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50 p-4 rounded-lg"
            >
              <h4 className="font-semibold text-blue-800 mb-2">Quiz Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 15 randomly selected questions about UNIOSUN</li>
                <li>• 70% minimum score required to pass</li>
                <li>• If you fail, retry after 24 hours</li>
                <li>• Passing unlocks your verified badge</li>
              </ul>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={startQuiz}
                disabled={!canTakeQuiz() || !questions?.length}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {!canTakeQuiz() && getTimeUntilNextAttempt() ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Try again in {getTimeUntilNextAttempt()}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Quiz Challenge
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizSection;
