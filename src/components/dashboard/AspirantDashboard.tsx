
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import BookingModal from '../booking/BookingModal';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [showBooking, setShowBooking] = React.useState(false);

  const { data: verifiedStudents, isLoading } = useQuery({
    queryKey: ['verified-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: mySessions } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_student_id_fkey (name, profile_image),
          departments:users!sessions_student_id_fkey (departments (name))
        `)
        .eq('client_id', profile.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const handleBookSession = (student: any) => {
    setSelectedStudent(student);
    setShowBooking(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.name}!
              </h1>
              <p className="text-gray-600">Find the perfect UNIOSUN student to guide you</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Talents</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Verified UNIOSUN Students</h2>
              <p className="text-gray-600">{verifiedStudents?.length || 0} talents available</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifiedStudents?.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={student.profile_image} />
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{student.name}</h3>
                            <p className="text-gray-600">{student.departments?.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-green-100 text-green-800">
                                <Star className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                              {student.badge && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Quiz Passed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">30 min session</span>
                            <span className="font-semibold">₦1,000</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">60 min session</span>
                            <span className="font-semibold">₦1,500</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleBookSession(student)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Session
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {mySessions?.length ? (
              <div className="space-y-4">
                {mySessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={session.users?.profile_image} />
                            <AvatarFallback>
                              {session.users?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{session.users?.name}</h3>
                            <p className="text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                              {new Date(session.scheduled_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={
                              session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {session.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {session.duration} mins - ₦{(session.amount / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-gray-600">Book your first session with a UNIOSUN student!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed sessions yet</h3>
                <p className="text-gray-600">Your session history will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BookingModal
          student={selectedStudent}
          open={showBooking}
          onClose={() => setShowBooking(false)}
        />
      </div>
    </div>
  );
};

export default AspirantDashboard;
