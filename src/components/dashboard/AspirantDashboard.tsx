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
  BookOpen, 
  MessageSquare, 
  Star, 
  Calendar, 
  Wallet, 
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  User,
  Settings
} from 'lucide-react';
import AspirantWallet from '@/components/wallet/AspirantWallet';  
import AspirantSessionsSection from '@/components/sessions/AspirantSessionsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AppealsForm from '@/components/appeals/AppealsForm';
import AppealsList from '@/components/appeals/AppealsList';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const { tabsRef, registerTab } = useAutoScrollTabs(activeTab);

  // Fetch available talents for quick access with timeout
  const { data: talents, isLoading: talentsLoading, error: talentsError, refetch: refetchTalents } = useQuery({
    queryKey: ['featured-talents'],
    queryFn: async () => {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Talents fetch timeout')), 15000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .limit(8);

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch user's sessions with timeout
  const { data: userSessions, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['user-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sessions fetch timeout')), 15000)
      );
      
      const fetchPromise = supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_student_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('client_id', profile.id)
        .order('scheduled_at', { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch user's transactions with timeout
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['user-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transactions fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('transactions')
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

  // Fetch popular departments with timeout
  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery({
    queryKey: ['popular-departments'],
    queryFn: async () => {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Departments fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('departments')
        .select('*')
        .limit(10);

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  const totalSpent = transactions?.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0;
  const completedSessions = userSessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = userSessions?.filter(s => s.status === 'confirmed').length || 0;

  // Combined loading and error states
  const isLoading = talentsLoading || sessionsLoading || transactionsLoading || departmentsLoading;
  const hasError = talentsError || sessionsError || transactionsError || departmentsError;
  const firstError = talentsError || sessionsError || transactionsError || departmentsError;

  const handleRetry = () => {
    refetchTalents();
  };

  if (!profile) return null;

  return (
    <DashboardErrorBoundary 
      loading={isLoading} 
      error={firstError} 
      onRetry={handleRetry}
    >
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
                <p className="text-xs sm:text-base text-gray-600 truncate">UNIOSUN Aspirant Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                <BookOpen className="w-3 h-3 mr-1" />
                Aspirant
              </Badge>
              {profile?.is_verified && (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          <Card className="mb-3 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 rounded-full bg-green-600 text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-green-800 text-sm">Ready to Learn?</h3>
                    <p className="text-green-700 text-xs">Browse available tutors and book your next study session to get expert help.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = '/talents'}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 w-full sm:w-auto"
                >
                  Find Tutors
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="w-full relative">
            <div ref={tabsRef} className="overflow-x-auto scrollbar-hide">
              <TabsList className="flex w-max min-w-full bg-green-100 h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  ref={(el) => registerTab('overview', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  ref={(el) => registerTab('sessions', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger 
                  value="wallet" 
                  ref={(el) => registerTab('wallet', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Wallet
                </TabsTrigger>
                <TabsTrigger 
                  value="appeals" 
                  ref={(el) => registerTab('appeals', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Appeals
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  ref={(el) => registerTab('profile', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  ref={(el) => registerTab('settings', el)}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">₦{(totalSpent / 100).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    On tutoring sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium">Sessions Attended</CardTitle>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-lg font-bold text-green-600">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Learning sessions
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
                  <div className="text-lg font-bold text-green-600">₦{((profile?.wallet_balance || 0) / 100).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Available balance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Featured Talents */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Star className="w-5 h-5" />
                  Featured Talents
                </CardTitle>
                <CardDescription>
                  Top-rated verified UNIOSUN students ready to help you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {talents && talents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {talents.slice(0, 4).map((talent) => (
                      <Card key={talent.id} className="border-green-200 hover:border-green-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-700 font-semibold text-sm">
                                {talent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{talent.name}</h4>
                              <p className="text-xs text-gray-600">{talent.departments?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">
                              {talent.quiz_score ? `${talent.quiz_score}% Quiz` : 'Verified'}
                            </span>
                           <div className="flex items-center gap-1">
                             <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                             <span>N/A</span>
                           </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">No featured talents available at the moment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Calendar className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Your latest tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userSessions && userSessions.length > 0 ? (
                  <div className="space-y-3">
                    {userSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex flex-col gap-2 p-3 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">{session.users?.name}</h4>
                            <p className="text-xs text-gray-600 truncate">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-green-600 text-sm">₦{(session.amount / 100).toLocaleString()}</span>
                          <Badge className={`text-xs px-2 py-1 ${
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
                    <p className="text-sm text-gray-600">Book your first tutoring session to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <AspirantSessionsSection />
          </TabsContent>

          <TabsContent value="wallet">
            <AspirantWallet />
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
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </DashboardErrorBoundary>
  );
};

export default AspirantDashboard;