
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SettlementManager from '@/components/payment/SettlementManager';
import { Users, GraduationCap, CheckCircle, XCircle, Eye, Shield, BarChart3, Clock, Flag, Wallet, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import AdminModerationPanel from './AdminModerationPanel';
import PlatformAnalytics from '@/components/analytics/PlatformAnalytics';

const AdminDashboard = () => {
  const { profile } = useAuth();

  // Fetch pending students for verification
  const { data: pendingStudents, refetch: refetchPending } = useQuery({
    queryKey: ['pending-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .eq('role', 'student')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all users statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data: students } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');

      const { data: aspirants } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'aspirant');

      const { data: verified } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('is_verified', true);

      const { data: badged } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('badge', true);

      return {
        totalStudents: students?.length || 0,
        totalAspirants: aspirants?.length || 0,
        verifiedStudents: verified?.length || 0,
        badgedStudents: badged?.length || 0
      };
    }
  });

  // Fetch recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_client_id_fkey (name),
          student:users!sessions_student_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const handleVerifyStudent = async (studentId: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: verify })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: verify ? "Student Verified" : "Student Rejected",
        description: verify 
          ? "Student has been verified and can now take the quiz" 
          : "Student verification has been rejected",
      });

      refetchPending();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student verification status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-base text-gray-600">Manage University Connect Platform</p>
            </div>
            <Badge className="bg-red-100 text-red-800 self-start sm:self-center text-xs px-2 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>
          </div>

          {/* Quick Access Management Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Link to="/admin/users">
              <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-green-800 mb-1">User Management</h3>
                      <p className="text-xs text-gray-600">Manage all platform users</p>
                    </div>
                    <Users className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/withdrawals">
              <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-green-800 mb-1">Withdrawal Management</h3>
                      <p className="text-xs text-gray-600">Monitor withdrawal requests</p>
                    </div>
                    <Wallet className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Card className="border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Students</p>
                    <p className="text-lg sm:text-3xl font-bold text-green-600">{userStats?.totalStudents || 0}</p>
                  </div>
                  <GraduationCap className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Aspirants</p>
                    <p className="text-lg sm:text-3xl font-bold text-green-600">{userStats?.totalAspirants || 0}</p>
                  </div>
                  <Users className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Verified Students</p>
                    <p className="text-lg sm:text-3xl font-bold text-green-600">{userStats?.verifiedStudents || 0}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Active Talents</p>
                    <p className="text-lg sm:text-3xl font-bold text-green-600">{userStats?.badgedStudents || 0}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 sm:w-12 sm:h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Tabs defaultValue="verification" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="flex w-max min-w-full bg-green-100 h-auto p-1 gap-1">
              <TabsTrigger value="verification" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                Student Verification
              </TabsTrigger>
              <TabsTrigger value="moderation" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                <Flag className="w-3 h-3 mr-1" />
                Moderation
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                User Management
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                Session Monitoring
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settlements" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 whitespace-nowrap">
                Settlements
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="verification" className="space-y-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <Clock className="w-4 h-4" />
                  Pending Student Verifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Review and verify student registrations with JAMB numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingStudents?.length ? (
                  <div className="space-y-3">
                    {pendingStudents.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-green-200 flex-shrink-0">
                            <AvatarImage src={student.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{student.name}</h4>
                            <p className="text-xs text-gray-600 truncate">{student.email}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="text-xs text-gray-500">
                                JAMB: {student.jamb_reg || 'Not provided'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Dept: {student.departments?.name || 'Not selected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerifyStudent(student.id, true)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs flex-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verify
                          </Button>
                          <Button
                            onClick={() => handleVerifyStudent(student.id, false)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 text-xs flex-1"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50 px-2">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-base font-semibold mb-2">No pending verifications</h3>
                    <p className="text-sm text-gray-600">All student registrations have been processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <AdminModerationPanel />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-base">User Management</CardTitle>
                <CardDescription className="text-xs">Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-base font-semibold mb-2">Advanced User Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Access the dedicated user management page for advanced features</p>
                  <Link to="/admin/users">
                    <Button className="bg-green-600 hover:bg-green-700 text-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Open User Management
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-base">Recent Sessions</CardTitle>
                <CardDescription className="text-xs">Monitor platform activity and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions?.length ? (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex flex-col gap-2 p-3 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {session.users?.name} → {session.student?.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(session.scheduled_at).toLocaleDateString()} • ₦{(session.amount / 100).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={`text-xs self-start px-2 py-1 ${
                          session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-base font-semibold mb-2">No sessions yet</h3>
                    <p className="text-sm text-gray-600">Session activity will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <PlatformAnalytics />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4">
            <SettlementManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
