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
        .limit(8);
      
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
        .limit(10);
      
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4">
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
            <Badge className="bg-blue-100 text-blue-800">
              <Users className="w-4 h-4 mr-1" />
              Aspirant
            </Badge>
          </div>

          <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-600 text-white">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">Ready to Connect with UNIOSUN Students?</h3>
                  <p className="text-green-700">Browse verified student talents and book study sessions to help with your university preparation.</p>
                </div>
                <Button 
                  onClick={() => navigate('/talents')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Browse Talents
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-green-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Wallet className="w-4 h-4 mr-1" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="talents" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Find Talents</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">My Sessions</TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Departments</TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Resources</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Booked this month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Finished sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{upcomingSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₦{totalSpent}</div>
                  <p className="text-xs text-muted-foreground">
                    On tutoring
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
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{session.student?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {session.student?.departments?.name} • {new Date(session.scheduled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">₦{session.amount}</span>
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
                    <Calendar className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600 mb-6">Book your first session with a verified student</p>
                    <Button 
                      onClick={() => navigate('/talents')}
                      className="bg-green-600 hover:bg-green-700 text-white"
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Search className="w-5 h-5" />
                  Browse All Talents
                </CardTitle>
                <CardDescription>
                  Find the perfect student to help with your studies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {talents && talents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {talents.map((talent) => (
                      <Card key={talent.id} className="border-green-200 hover:border-green-300 transition-colors hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-700 font-semibold">
                                {talent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{talent.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">{talent.departments?.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">4.8</span>
                              <span className="text-xs text-gray-500">(12 reviews)</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {talent.quiz_score ? `${talent.quiz_score}%` : 'Verified'}
                            </Badge>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600 mb-2">₦1,000/hour</div>
                            <Button 
                              onClick={() => navigate('/talents')}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              Book Session
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Discover UNIOSUN Talents</h3>
                    <p className="text-gray-600 mb-6">Browse verified students by department and expertise</p>
                    <Button 
                      onClick={() => navigate('/talents')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse Talents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Calendar className="w-5 h-5" />
                  My Sessions
                </CardTitle>
                <CardDescription>
                  Track your booked sessions and study progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{session.student?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {session.student?.departments?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-green-600">₦{session.amount}</div>
                            <div className="text-xs text-gray-500">{session.duration} mins</div>
                          </div>
                          <Badge className={
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600 mb-6">Book your first session with a verified student</p>
                    <Button 
                      onClick={() => navigate('/talents')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Find a Tutor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <BookOpen className="w-5 h-5" />
                  Popular Departments
                </CardTitle>
                <CardDescription>
                  Explore departments with available tutors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departments && departments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                      <Card key={dept.id} className="border-green-200 hover:border-green-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <BookOpen className="w-8 h-8 text-green-600" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{dept.name}</h4>
                              <p className="text-xs text-gray-600">{dept.studentCount} verified tutors</p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => navigate('/talents')}
                            variant="outline" 
                            size="sm" 
                            className="w-full border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Browse Tutors
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading departments...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <BookOpen className="w-5 h-5" />
                  Study Resources
                </CardTitle>
                <CardDescription>
                  Helpful resources for UNIOSUN aspirants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-green-200">
                    <CardContent className="p-6">
                      <BookOpen className="w-8 h-8 text-green-600 mb-4" />
                      <h3 className="font-semibold mb-2">Study Guides</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Access comprehensive study materials and guides for UNIOSUN entrance preparation.
                      </p>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-6">
                      <Users className="w-8 h-8 text-green-600 mb-4" />
                      <h3 className="font-semibold mb-2">Study Groups</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Join study groups with other aspirants and get group tutoring sessions.
                      </p>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-6">
                      <MessageSquare className="w-8 h-8 text-green-600 mb-4" />
                      <h3 className="font-semibold mb-2">Past Questions</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Practice with past UNIOSUN entrance examination questions and answers.
                      </p>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-6">
                      <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
                      <h3 className="font-semibold mb-2">Progress Tracking</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Monitor your learning progress and track your improvement over time.
                      </p>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>
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
