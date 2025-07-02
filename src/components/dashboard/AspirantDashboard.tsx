
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

  // Fetch available talents for quick access
  const { data: talents } = useQuery({
    queryKey: ['featured-talents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .limit(8);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's sessions
  const { data: sessions } = useQuery({
    queryKey: ['aspirant-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (name, profile_image)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch user's transactions
  const { data: transactions } = useQuery({
    queryKey: ['aspirant-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch popular departments
  const { data: departments } = useQuery({
    queryKey: ['popular-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          users!users_department_id_fkey(id)
        `)
        .limit(6);
      
      if (error) throw error;
      return data?.map(dept => ({
        ...dept,
        studentCount: dept.users?.length || 0
      }));
    }
  });

  const totalSpent = transactions?.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0;
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
                <Button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 w-full sm:w-auto">
                  Find Tutors
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="flex w-max min-w-full bg-green-100 h-auto p-1 gap-1 overflow-x-auto scrollbar-hide">
              <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Sessions
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Wallet
              </TabsTrigger>
              <TabsTrigger value="appeals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Appeals
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 py-2 text-xs whitespace-nowrap">
                Settings
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

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
                              <span>4.8</span>
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
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex flex-col gap-2 p-3 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">{session.student?.name}</h4>
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

          <TabsContent value="profile">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Users className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your aspirant profile details
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
                    <label className="text-sm font-medium text-gray-700">Account Type</label>
                    <p className="mt-1 text-gray-900">JAMB Aspirant</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-gray-900">{profile?.is_verified ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AspirantDashboard;
