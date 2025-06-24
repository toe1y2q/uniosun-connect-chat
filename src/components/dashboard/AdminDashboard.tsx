import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, CheckCircle, XCircle, Eye, Shield, BarChart3, Clock, Flag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminModerationPanel from './AdminModerationPanel';

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
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Manage UNIOSUN Connect Platform</p>
            </div>
            <Badge className="bg-red-100 text-red-800">
              <Shield className="w-4 h-4 mr-1" />
              Administrator
            </Badge>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-green-600">{userStats?.totalStudents || 0}</p>
                  </div>
                  <GraduationCap className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Aspirants</p>
                    <p className="text-3xl font-bold text-green-600">{userStats?.totalAspirants || 0}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified Students</p>
                    <p className="text-3xl font-bold text-green-600">{userStats?.verifiedStudents || 0}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Talents</p>
                    <p className="text-3xl font-bold text-green-600">{userStats?.badgedStudents || 0}</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-green-100">
            <TabsTrigger value="verification" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Student Verification</TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Flag className="w-4 h-4 mr-1" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">User Management</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Session Monitoring</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Clock className="w-5 h-5" />
                  Pending Student Verifications
                </CardTitle>
                <CardDescription>
                  Review and verify student registrations with JAMB numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingStudents?.length ? (
                  <div className="space-y-4">
                    {pendingStudents.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border border-green-200 rounded-lg hover:bg-green-50"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-green-200">
                            <AvatarImage src={student.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                JAMB: {student.jamb_reg || 'Not provided'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Dept: {student.departments?.name || 'Not selected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleVerifyStudent(student.id, true)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            onClick={() => handleVerifyStudent(student.id, false)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending verifications</h3>
                    <p className="text-gray-600">All student registrations have been processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <AdminModerationPanel />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">User Management</h3>
                  <p className="text-gray-600">Advanced user management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Recent Sessions</CardTitle>
                <CardDescription>Monitor platform activity and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions?.length ? (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {session.users?.name} → {session.student?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.scheduled_at).toLocaleDateString()} • ₦{(session.amount / 100).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={
                          session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600">Session activity will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Platform Analytics</CardTitle>
                <CardDescription>View detailed platform statistics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">Detailed analytics and reporting features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
