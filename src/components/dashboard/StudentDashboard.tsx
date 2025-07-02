
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <AvatarUpload size="sm" showUploadButton={false} />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Welcome back, {profile?.name}!
                </h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">UNIOSUN Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                <GraduationCap className="w-3 h-3 mr-1" />
                Student
              </Badge>
              {profile?.is_verified && (
                <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile?.badge && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  Certified Tutor
                </Badge>
              )}
            </div>
          </div>

          {/* Status Cards */}
          {!profile?.is_verified ? (
            <Card className="mb-3 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-yellow-500 text-white">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-yellow-800 text-sm">Account Under Review</h3>
                    <p className="text-yellow-700 text-xs">Your student account is being verified by our admin team. This may take 24-48 hours.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !profile?.badge ? (
            <Card className="mb-3 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 rounded-full bg-blue-600 text-white">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-800 text-sm">Ready to Take the Quiz?</h3>
                      <p className="text-blue-700 text-xs">Complete the department quiz to become a certified tutor and start earning from sessions.</p>
                    </div>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 w-full sm:w-auto">
                    Take Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-3 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 rounded-full bg-green-600 text-white">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-green-800 text-sm">Certified Tutor Active!</h3>
                      <p className="text-green-700 text-xs">You're now able to receive session bookings and earn money as a verified tutor.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">₦{profile?.wallet_balance || 0}</div>
                    <p className="text-xs text-green-600">Wallet Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full relative">
            <TabsList className="flex w-max min-w-full bg-green-100 h-auto p-1 gap-1 overflow-x-auto scrollbar-hide scroll-smooth">
              <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Sessions
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Wallet
              </TabsTrigger>
              <TabsTrigger value="quiz" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Quiz
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="appeals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Appeals
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">₦{totalEarnings}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Completed Sessions</CardTitle>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions taught
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">{upcomingSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Wallet Balance</CardTitle>
                  <Wallet className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">₦{profile?.wallet_balance || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Available to withdraw
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-green-200">
              <CardHeader className="px-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <Calendar className="w-4 h-4" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Your latest tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3">
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex flex-col gap-2 p-3 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">{session.client?.name}</h4>
                            <p className="text-xs text-gray-600 truncate">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-green-600 text-sm">₦{session.amount}</span>
                          <Badge className={`text-xs px-2 py-1 ${
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
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-green-400 mx-auto mb-4" />
                    <h3 className="text-base font-semibold mb-2">No sessions yet</h3>
                    <p className="text-sm text-gray-600">Complete your verification and quiz to start receiving bookings</p>
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
