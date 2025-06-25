import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Flag, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  AlertTriangle,
  Users,
  Star,
  Clock,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

const AdminModerationPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch flagged sessions/reports
  const { data: flaggedSessions, refetch: refetchFlagged } = useQuery({
    queryKey: ['flagged-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          chat_messages!reports_message_id_fkey (
            message,
            session_id,
            sender_id,
            sessions!chat_messages_session_id_fkey (
              *,
              client:users!sessions_client_id_fkey (name, email),
              student:users!sessions_student_id_fkey (name, email)
            )
          ),
          flagged_by_user:users!reports_flagged_by_fkey (name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch users for moderation with enhanced filtering
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch student performance data
  const { data: studentPerformance } = useQuery({
    queryKey: ['student-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name),
          sessions_as_student:sessions!sessions_student_id_fkey (
            id,
            status,
            amount,
            reviews (rating, comment)
          )
        `)
        .eq('role', 'student')
        .eq('is_verified', true);
      
      if (error) throw error;
      
      return data?.map(student => {
        const sessions = student.sessions_as_student || [];
        const reviews = sessions.flatMap(s => s.reviews || []);
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
          : 0;
        
        return {
          ...student,
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.status === 'completed').length,
          totalEarnings: sessions.reduce((sum, s) => sum + (s.amount || 0), 0),
          averageRating: avgRating,
          reviewCount: reviews.length
        };
      });
    }
  });

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: block ? 'blocked' : 'active' 
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: block ? "User Blocked" : "User Unblocked",
        description: `User has been ${block ? 'blocked' : 'unblocked'} successfully`
      });

      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: `Report ${action}`,
        description: `The report has been ${action} successfully`
      });

      refetchFlagged();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-red-100">
          <TabsTrigger value="flagged" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Flag className="w-4 h-4 mr-2" />
            Flagged Content
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Star className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="appeals" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Appeals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Flag className="w-5 h-5" />
                Flagged Sessions & Messages
              </CardTitle>
              <CardDescription>
                Review reported content and take appropriate action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedSessions && flaggedSessions.length > 0 ? (
                <div className="space-y-4">
                  {flaggedSessions.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-red-200 rounded-lg p-4 bg-red-50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <h4 className="font-semibold text-red-800">
                              Report: {report.reason}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Reported by {report.flagged_by_user?.name} on{' '}
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive">Pending</Badge>
                      </div>

                      {report.chat_messages && (
                        <div className="bg-white p-3 rounded border mb-4">
                          <p className="text-sm"><strong>Message:</strong> {report.chat_messages.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Session between {report.chat_messages.sessions?.client?.name} and{' '}
                            {report.chat_messages.sessions?.student?.name}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleReportAction(report.id, 'resolved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          onClick={() => handleReportAction(report.id, 'dismissed')}
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Eye className="w-4 h-4 mr-1" />
                          View Session
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Flag className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No flagged content</h3>
                  <p className="text-gray-600">All reports have been resolved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                User Management & Blocking
              </CardTitle>
              <CardDescription>
                Search, block, and manage user accounts across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>

              {users && users.length > 0 ? (
                <div className="space-y-4">
                  {users.slice(0, 15).map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-200">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-gray-100">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'student' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {user.role}
                            </Badge>
                            <Badge variant={
                              user.status === 'active' ? 'default' :
                              user.status === 'blocked' ? 'destructive' :
                              'secondary'
                            }>
                              {user.status || 'active'}
                            </Badge>
                            {user.is_verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {user.departments && (
                            <p className="text-xs text-gray-500 mt-1">
                              Dept: {user.departments.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.status === 'blocked' ? (
                          <Button
                            onClick={() => handleBlockUser(user.id, false)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBlockUser(user.id, true)}
                            variant="destructive"
                            size="sm"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Block User
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Star className="w-5 h-5" />
                Student Performance Monitor
              </CardTitle>
              <CardDescription>
                Track student ratings and session statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentPerformance && studentPerformance.length > 0 ? (
                <div className="space-y-4">
                  {studentPerformance.slice(0, 10).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-200">
                          <AvatarImage src={student.profile_image} />
                          <AvatarFallback className="bg-gray-100">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.departments?.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {student.totalSessions} sessions
                            </span>
                            <span className="text-xs text-gray-500">
                              ₦{(student.totalEarnings / 100).toLocaleString()} earned
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {student.averageRating ? student.averageRating.toFixed(1) : 'N/A'}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({student.reviewCount} reviews)
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.completedSessions}/{student.totalSessions} completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                  <p className="text-gray-600">Student performance metrics will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <MessageSquare className="w-5 h-5" />
                Student Appeals & Complaints
              </CardTitle>
              <CardDescription>
                Review and respond to user appeals, complaints, and support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-700">Appeals System</h3>
                <p className="text-gray-600 mb-4">
                  No appeals or complaints have been submitted yet.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-2">How Appeals Work:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Users can submit appeals through their dashboard</li>
                    <li>• Appeals appear here for admin review</li>
                    <li>• Admins can respond and update appeal status</li>
                    <li>• Users are notified of admin responses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminModerationPanel;
