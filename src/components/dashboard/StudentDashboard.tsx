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
import { useAutoScrollTabs } from '@/hooks/use-auto-scroll-tabs';
import DashboardErrorBoundary from './DashboardErrorBoundary';
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
  const [activeTab, setActiveTab] = React.useState('overview');
  const { tabsRef, registerTab } = useAutoScrollTabs(activeTab);

  // Fetch student's sessions with timeout and error handling
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: ['student-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sessions fetch timeout')), 15000)
      );
      
      const fetchPromise = supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_client_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('student_id', profile.id)
        .order('scheduled_at', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch student's earnings from transactions with timeout
  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useQuery({
    queryKey: ['student-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Earnings fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('type', 'earning')
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch student's withdrawals with timeout
  const { data: withdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = useQuery({
    queryKey: ['student-withdrawals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Withdrawals fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const totalEarnings = earnings?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((sum, withdrawal) => sum + withdrawal.amount, 0) || 0;
  const availableBalance = totalEarnings - totalWithdrawals;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'confirmed').length || 0;

  // Combined loading and error states
  const isLoading = sessionsLoading || earningsLoading || withdrawalsLoading;
  const hasError = sessionsError || earningsError || withdrawalsError;
  const firstError = sessionsError || earningsError || withdrawalsError;

  const handleRetry = () => {
    refetchSessions();
  };

  if (!profile) return null;

  return (
    <DashboardErrorBoundary 
      loading={isLoading} 
      error={firstError} 
      onRetry={handleRetry}
    >
    <div className="min-h-screen bg-background p-2 sm:p-4">
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
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                  Welcome back, {profile?.name}!
                </h1>
                <p className="text-xs sm:text-base text-muted-foreground truncate">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className="bg-primary/10 text-primary text-xs px-2 py-1">
                <GraduationCap className="w-3 h-3 mr-1" />
                Student
              </Badge>
              {profile?.is_verified && (
                <Badge className="bg-blue-500/10 text-blue-600 text-xs px-2 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile?.badge && (
                <Badge className="bg-yellow-500/10 text-yellow-600 text-xs px-2 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  Certified
                </Badge>
              )}
            </div>
          </div>

          {/* Status Cards */}
          {!profile?.is_verified ? (
            <Card className="mb-3 border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-yellow-500 text-white">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-yellow-700 text-sm">Account Under Review</h3>
                    <p className="text-yellow-600 text-xs">Your student account is being verified by our admin team. This may take 24-48 hours.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !profile?.badge ? (
            <Card className="mb-3 border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 rounded-full bg-blue-600 text-white">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-700 text-sm">Ready to Take the Quiz?</h3>
                      <p className="text-blue-600 text-xs">Complete the department quiz to become a certified tutor and start earning.</p>
                    </div>
                  </div>
                  <Button className="text-xs px-3 py-2 w-full sm:w-auto">
                    Take Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-3 border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 rounded-full bg-primary text-primary-foreground">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary text-sm">Verified Student Active!</h3>
                      <p className="text-muted-foreground text-xs">You're now able to receive gig applications and earn money.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">₦{(availableBalance / 100).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Wallet Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="w-full relative">
            <div ref={tabsRef} className="overflow-x-auto scrollbar-hide">
              <TabsList className="flex w-max min-w-full bg-muted h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  ref={(el) => registerTab('overview', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  ref={(el) => registerTab('sessions', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger 
                  value="wallet" 
                  ref={(el) => registerTab('wallet', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Wallet
                </TabsTrigger>
                <TabsTrigger 
                  value="quiz" 
                  ref={(el) => registerTab('quiz', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Quiz
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  ref={(el) => registerTab('reviews', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Reviews
                </TabsTrigger>
                <TabsTrigger 
                  value="appeals" 
                  ref={(el) => registerTab('appeals', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Appeals
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  ref={(el) => registerTab('profile', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  ref={(el) => registerTab('settings', el)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Total Earnings</CardTitle>
                  <DollarSign className="h-3 w-3 text-primary" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-primary">₦{(totalEarnings / 100).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Completed Sessions</CardTitle>
                  <CheckCircle className="h-3 w-3 text-primary" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-foreground">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions completed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Upcoming Sessions</CardTitle>
                  <Calendar className="h-3 w-3 text-primary" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-foreground">{upcomingSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Wallet Balance</CardTitle>
                  <Wallet className="h-3 w-3 text-primary" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-primary">₦{(availableBalance / 100).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Available to withdraw
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader className="px-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-base">
                  <Calendar className="w-4 h-4" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Your latest sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3">
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex flex-col gap-2 p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-foreground truncate">{session.users?.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary text-sm">₦{(session.amount / 100).toLocaleString()}</span>
                          <Badge className={`text-xs px-2 py-1 ${
                            session.status === 'completed' ? 'bg-primary/10 text-primary' :
                            session.status === 'confirmed' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base font-semibold mb-2 text-foreground">No sessions yet</h3>
                    <p className="text-sm text-muted-foreground">Complete your verification and quiz to start receiving bookings</p>
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

          <TabsContent value="profile" className="space-y-0">
            <div className="w-full">
              <ProfileSettings />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="text-center py-6">
                  <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base font-semibold mb-2 text-foreground">Account Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your account preferences and security settings</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </DashboardErrorBoundary>
  );
};

export default StudentDashboard;
