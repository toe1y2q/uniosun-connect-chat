import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  UserX,
  Send
} from 'lucide-react';

const AdminModerationPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch flagged sessions/reports with real-time updates
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

  // Fetch student performance data with real reviews
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

  // Fetch all appeals for admin review
  const { data: appeals } = useQuery({
    queryKey: ['all-appeals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appeals')
        .select(`
          *,
          user:users!appeals_user_id_fkey (name, email, role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Block/unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: block ? 'blocked' : 'active' 
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { block }) => {
      toast({
        title: block ? "User Blocked" : "User Unblocked",
        description: `User has been ${block ? 'blocked' : 'unblocked'} successfully`
      });
      refetchUsers();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  });

  // Report action mutation
  const reportActionMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: 'resolved' | 'dismissed' }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: action })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      toast({
        title: `Report ${action}`,
        description: `The report has been ${action} successfully`
      });
      refetchFlagged();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  });

  // Appeal response mutation
  const respondToAppealMutation = useMutation({
    mutationFn: async ({ appealId, response, status }: { appealId: string; response: string; status: string }) => {
      const { error } = await supabase
        .from('appeals')
        .update({ 
          admin_response: response,
          status: status
        })
        .eq('id', appealId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user"
      });
      setSelectedAppeal(null);
      setAdminResponse('');
      queryClient.invalidateQueries({ queryKey: ['all-appeals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    }
  });

  const handleBlockUser = (userId: string, block: boolean) => {
    blockUserMutation.mutate({ userId, block });
  };

  const handleReportAction = (reportId: string, action: 'resolved' | 'dismissed') => {
    reportActionMutation.mutate({ reportId, action });
  };

  const handleAppealResponse = (appealId: string, status: 'resolved' | 'rejected') => {
    if (!adminResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response before submitting",
        variant: "destructive"
      });
      return;
    }
    
    respondToAppealMutation.mutate({ 
      appealId, 
      response: adminResponse, 
      status 
    });
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
                          disabled={reportActionMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          onClick={() => handleReportAction(report.id, 'dismissed')}
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          disabled={reportActionMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Dismiss
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
                            disabled={blockUserMutation.isPending}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBlockUser(user.id, true)}
                            variant="destructive"
                            size="sm"
                            disabled={blockUserMutation.isPending}
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
                              ₦{student.totalEarnings.toLocaleString()} earned
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
              {appeals && appeals.length > 0 ? (
                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <motion.div
                      key={appeal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{appeal.subject}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            From: {appeal.user?.name} ({appeal.user?.email})
                          </p>
                          <Badge className={`mb-2 ${
                            appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appeal.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                            appeal.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appeal.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(appeal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{appeal.description}</p>
                      
                      {appeal.admin_response && (
                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400 mb-4">
                          <h5 className="font-semibold text-blue-800 mb-1">Admin Response:</h5>
                          <p className="text-sm text-blue-700">{appeal.admin_response}</p>
                        </div>
                      )}
                      
                      {appeal.status === 'pending' && (
                        <div className="border-t pt-4">
                          {selectedAppeal?.id === appeal.id ? (
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Write your response to this appeal..."
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                rows={3}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleAppealResponse(appeal.id, 'resolved')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={respondToAppealMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolve
                                </Button>
                                <Button
                                  onClick={() => handleAppealResponse(appeal.id, 'rejected')}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  disabled={respondToAppealMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedAppeal(null);
                                    setAdminResponse('');
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setSelectedAppeal(appeal)}
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Respond
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">No Appeals Yet</h3>
                  <p className="text-gray-600 mb-4">
                    No appeals or complaints have been submitted yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminModerationPanel;
