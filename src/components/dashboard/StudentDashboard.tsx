import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Star, 
  Calendar, 
  Wallet, 
  DollarSign,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  User
} from 'lucide-react';
import WalletSection from '@/components/wallet/WalletSection';
import QuizSection from '@/components/quiz/QuizSection';
import SessionsSection from '@/components/sessions/SessionsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import AvatarUpload from '@/components/profile/AvatarUpload';
import ReviewsList from '@/components/reviews/ReviewsList';
import AppealsForm from '@/components/appeals/AppealsForm';
import AppealsList from '@/components/appeals/AppealsList';

const StudentDashboard = () => {
  const { profile } = useAuth();

  // Fetch student's sessions
  const { data: sessions } = useQuery({
    queryKey: ['student-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:users!sessions_client_id_fkey (name)
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch earnings data
  const { data: earnings } = useQuery({
    queryKey: ['student-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('type', 'earning')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const totalEarnings = earnings?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'confirmed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <AvatarUpload size="md" showUploadButton={false} />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Welcome back, {profile?.name}!
                </h1>
                <p className="text-sm sm:text-base text-gray-600">UNIOSUN Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Student
              </Badge>
              {profile?.is_verified && (
                <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Verified
                </Badge>
              )}
              {profile?.badge && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Certified Tutor
                </Badge>
              )}
            </div>
          </div>

          {!profile?.is_verified ? (
            <Card className="mb-4 sm:mb-6 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-yellow-500 text-white self-start">
                    <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">Account Under Review</h3>
                    <p className="text-yellow-700 text-xs sm:text-sm">Your student account is being verified by our admin team. This may take 24-48 hours.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !profile?.badge ? (
            <Card className="mb-4 sm:mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-blue-600 text-white self-start">
                    <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Ready to Take the Quiz?</h3>
                    <p className="text-blue-700 text-xs sm:text-sm">Complete the department quiz to become a certified tutor and start earning from sessions.</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2">
                    Take Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 sm:mb-6 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-green-600 text-white self-start">
                    <Award className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-green-800 text-sm sm:text-base">Certified Tutor Active!</h3>
                    <p className="text-green-700 text-xs sm:text-sm">You're now able to receive session bookings and earn money as a verified tutor.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">₦{profile?.wallet_balance || 0}</div>
                    <p className="text-xs sm:text-sm text-green-600">Wallet Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-green-100 h-auto p-1 text-xs sm:text-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Wallet
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Quiz
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="appeals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Appeals
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 py-2 sm:px-3 sm:py-2">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">₦{totalEarnings}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Completed Sessions</CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions taught
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{upcomingSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Wallet Balance</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">₦{profile?.wallet_balance || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Available to withdraw
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-green-200">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your latest tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-green-200 rounded-lg gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{session.client?.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <span className="font-semibold text-green-600 text-sm sm:text-base">₦{session.amount}</span>
                          <Badge className={`text-xs ${
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-sm sm:text-base text-gray-600">Complete your verification and quiz to start receiving bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsSection />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletSection />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizSection />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsList />
          </TabsContent>

          <TabsContent value="appeals" className="space-y-6">
            <AppealsForm />
            <AppealsList />
          </TabsContent>

          <TabsContent value="profile">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Users className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your student profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <AvatarUpload size="lg" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{profile?.name}</h3>
                    <p className="text-gray-600">{profile?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-gray-900">{profile?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{profile?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">JAMB Registration</label>
                    <p className="mt-1 text-gray-900">{profile?.jamb_reg || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quiz Score</label>
                    <p className="mt-1 text-gray-900">{profile?.quiz_score ? `${profile.quiz_score}%` : 'Not taken'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
