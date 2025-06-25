
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
  Users, 
  BookOpen, 
  MessageSquare, 
  Star, 
  Calendar, 
  Wallet, 
  DollarSign,
  Search,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  User,
  Shield
} from 'lucide-react';
import AspirantWallet from '@/components/wallet/AspirantWallet';
import ProfileSettings from '@/components/profile/ProfileSettings';
import AvatarUpload from '@/components/profile/AvatarUpload';
import { useNavigate } from 'react-router-dom';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch aspirant's sessions as a client
  const { data: sessions } = useQuery({
    queryKey: ['aspirant-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (name)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch spending data
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

  const totalSpent = transactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'confirmed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <AvatarUpload size="md" showUploadButton={false} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {profile?.name}!
                </h1>
                <p className="text-gray-600">UNIOSUN Aspirant Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                <Users className="w-4 h-4 mr-1" />
                Aspirant
              </Badge>
              {profile?.role === 'admin' && (
                <Button 
                  onClick={() => navigate('/admin')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Proceed as Admin
                </Button>
              )}
            </div>
          </div>

          {/* Admin Notice Card */}
          {profile?.role === 'admin' && (
            <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-600 text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Admin Access Available</h3>
                    <p className="text-red-700">You have administrator privileges. Access the admin panel to manage the platform.</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/admin')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Go to Admin Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Welcome Card */}
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-600 text-white">
                  <Search className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">Ready to Find Tutors?</h3>
                  <p className="text-blue-700">Browse available UNIOSUN students and book tutoring sessions to help with your studies.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">₦{profile?.wallet_balance || 0}</div>
                  <p className="text-sm text-blue-600">Wallet Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-blue-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">My Sessions</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Wallet</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Profile</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₦{totalSpent}</div>
                  <p className="text-xs text-muted-foreground">
                    On tutoring sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessions attended
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{upcomingSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₦{profile?.wallet_balance || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Available for sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sessions as Client */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Calendar className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Your latest tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{session.student?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-blue-600">₦{session.amount}</span>
                          <Badge className={
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600">Browse talents and book your first tutoring session</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Calendar className="w-5 h-5" />
                  My Booked Sessions
                </CardTitle>
                <CardDescription>
                  Manage your tutoring appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{session.student?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()} at {new Date(session.scheduled_at).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-500">Duration: {session.duration} minutes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-semibold text-blue-600 text-lg">₦{session.amount}</span>
                            <Badge className={
                              session.status === 'completed' ? 'bg-green-100 text-green-800 ml-2' :
                              session.status === 'confirmed' ? 'bg-blue-100 text-blue-800 ml-2' :
                              'bg-yellow-100 text-yellow-800 ml-2'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No sessions booked</h3>
                    <p className="text-gray-600 mb-4">You haven't booked any tutoring sessions yet.</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Browse Tutors
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <AspirantWallet />
          </TabsContent>

          <TabsContent value="profile">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <User className="w-5 h-5" />
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
                    <p className="mt-1 text-gray-900">Aspirant</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Wallet Balance</label>
                    <p className="mt-1 text-gray-900">₦{profile?.wallet_balance || 0}</p>
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
