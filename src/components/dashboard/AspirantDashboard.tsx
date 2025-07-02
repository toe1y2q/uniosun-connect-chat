
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
  Users, 
  Calendar, 
  Search, 
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  MapPin,
  DollarSign,
  Settings,
  User,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileSettings from '@/components/profile/ProfileSettings';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AspirantWallet from '@/components/wallet/AspirantWallet';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

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
        .limit(6);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's sessions
  const { data: sessions } = useQuery({
    queryKey: ['my-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (name, departments!users_department_id_fkey (name))
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
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

  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'confirmed').length || 0;
  const totalSpent = sessions?.reduce((sum, session) => sum + (session.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-md mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AvatarUpload size="sm" showUploadButton={false} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome, {profile?.name?.split(' ')[0]}!
                </h1>
                <p className="text-sm text-gray-600">UNIOSUN Aspirant</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Aspirant
            </Badge>
          </div>

          <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-600 text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 text-sm">Ready to Connect?</h3>
                  <p className="text-green-700 text-xs">Browse verified student talents and book sessions.</p>
                </div>
                <Button 
                  onClick={() => navigate('/talents')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Browse
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-green-100 h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">Overview</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">Wallet</TabsTrigger>
            <TabsTrigger value="talents" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">Talents</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">{totalSessions}</div>
                  <p className="text-xs text-gray-600">Total Sessions</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">{completedSessions}</div>
                  <p className="text-xs text-gray-600">Completed</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">{upcomingSessions}</div>
                  <p className="text-xs text-gray-600">Upcoming</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">₦{Math.floor(totalSpent / 100)}</div>
                  <p className="text-xs text-gray-600">Total Spent</p>
                </CardContent>
              </Card>
            </div>

            {/* Featured Talents */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <Star className="w-4 h-4" />
                  Featured Talents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {talents && talents.length > 0 ? (
                  <div className="space-y-3">
                    {talents.slice(0, 3).map((talent) => (
                      <div 
                        key={talent.id} 
                        className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer"
                        onClick={() => navigate(`/student/${talent.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 font-semibold text-sm">
                              {talent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{talent.name}</h4>
                            <p className="text-xs text-gray-600">{talent.departments?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">4.8</span>
                          </div>
                          <p className="text-xs text-green-600">
                            {talent.quiz_score}%
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => navigate('/talents')}
                      variant="outline" 
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 mt-3"
                      size="sm"
                    >
                      View All Talents
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Star className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No featured talents available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <Calendar className="w-4 h-4" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{session.student?.name}</h4>
                            <p className="text-xs text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600 text-sm">₦{Math.floor(session.amount / 100)}</span>
                          <Badge className={`ml-2 text-xs ${
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
                    <Calendar className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600 text-sm mb-4">Book your first session</p>
                    <Button 
                      onClick={() => navigate('/talents')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      Find a Tutor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <AspirantWallet />
          </TabsContent>

          <TabsContent value="talents">
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <Search className="w-4 h-4" />
                  Browse Talents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <GraduationCap className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-base font-semibold mb-2">Discover UNIOSUN Talents</h3>
                  <p className="text-gray-600 text-sm mb-6">Browse verified students by department</p>
                  <Button 
                    onClick={() => navigate('/talents')}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse All Talents
                  </Button>
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
