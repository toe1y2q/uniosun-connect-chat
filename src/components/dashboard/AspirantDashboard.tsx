import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, Calendar, MessageSquare, Wallet, Clock, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch verified students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['verified-students', selectedDepartment, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', true)
        .eq('badge', true);

      if (selectedDepartment) {
        query = query.eq('department_id', selectedDepartment);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch aspirant's sessions
  const { data: sessions } = useQuery({
    queryKey: ['aspirant-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_student_id_fkey (name, email, profile_image)
        `)
        .eq('client_id', profile.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch wallet info
  const { data: wallet } = useQuery({
    queryKey: ['wallet', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const handleBookSession = async (studentId: string, studentName: string) => {
    toast({
      title: "Booking Feature",
      description: `Booking session with ${studentName}. Payment integration coming soon!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4">
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
              <p className="text-gray-600">Aspirant Dashboard - Find Your Perfect Study Partner</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <GraduationCap className="w-4 h-4 mr-1" />
              Aspirant
            </Badge>
          </div>
        </motion.div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-green-100">
            <TabsTrigger value="discover" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Discover Talents</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">My Sessions</TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Messages</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search and Filter */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Search className="w-5 h-5" />
                  Find UNIOSUN Students
                </CardTitle>
                <CardDescription>
                  Search for verified students by department or name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by student name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="w-64">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="">All Departments</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingStudents ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-green-200">
                    <CardContent className="p-6">
                      <div className="h-24 bg-green-100 rounded mb-4"></div>
                      <div className="h-4 bg-green-100 rounded mb-2"></div>
                      <div className="h-4 bg-green-100 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : students?.length ? (
                students.map((student) => (
                  <motion.div
                    key={student.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow border-green-200 hover:border-green-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="h-16 w-16 border-2 border-green-200">
                            <AvatarImage src={student.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.departments?.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Verified
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quiz Score:</span>
                            <span className="font-semibold text-green-600">
                              {student.quiz_score || 'N/A'}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Rating:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>4.8</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button 
                            onClick={() => handleBookSession(student.id, student.name)}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Session
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 border-green-200 text-green-700 hover:bg-green-50">
                              ₦1,000 • 30min
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 border-green-200 text-green-700 hover:bg-green-50">
                              ₦1,500 • 60min
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <GraduationCap className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No students found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>My Booked Sessions</CardTitle>
                <CardDescription>View and manage your study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions?.length ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="border-2 border-green-200">
                            <AvatarImage src={session.users?.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {session.users?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{session.users?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration} mins
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {session.status}
                          </Badge>
                          <span className="font-semibold">₦{(session.amount / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions booked yet</h3>
                    <p className="text-gray-600">Start by finding and booking a session with a student</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </CardTitle>
                <CardDescription>Chat with your booked students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-gray-600">Messages will appear here after booking sessions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet & Payments
                </CardTitle>
                <CardDescription>Manage your payments and transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ₦{wallet?.balance ? (wallet.balance / 100).toLocaleString() : '0'}
                      </div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {sessions?.length || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">₦0</div>
                      <p className="text-sm text-gray-600">This Month</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-gray-600">Your payment history will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AspirantDashboard;
