
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Filter, MoreHorizontal, CheckCircle, XCircle, Ban, UserCheck, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';

type UserRole = 'student' | 'aspirant' | 'admin';

const UserManagementPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

  // Fetch all users (admin only)
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users', searchTerm, filterRole, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          departments!users_department_id_fkey (name)
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply role filter
      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      // Apply status filter
      if (filterStatus === 'verified') {
        query = query.eq('is_verified', true);
      } else if (filterStatus === 'unverified') {
        query = query.eq('is_verified', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin'
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (error) => {
      console.error('Update user error:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleVerifyUser = (userId: string, verify: boolean) => {
    updateUserMutation.mutate({
      userId,
      updates: { is_verified: verify }
    });
  };

  const handleToggleBadge = (userId: string, hasBadge: boolean) => {
    updateUserMutation.mutate({
      userId,
      updates: { badge: !hasBadge }
    });
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    updateUserMutation.mutate({
      userId,
      updates: { role: newRole }
    });
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="px-3 py-4 sm:px-4 sm:py-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-sm sm:text-base text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <Link to="/admin" className="inline-flex items-center text-green-600 hover:text-green-700 mb-3 sm:mb-4 text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-xs sm:text-sm text-gray-600">Manage all platform users and their permissions</p>
              </div>
              <Badge className="bg-red-100 text-red-800 self-start sm:self-center">
                <Users className="w-4 h-4 mr-1" />
                Admin Panel
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                
                <Select value={filterRole} onValueChange={(value: UserRole | 'all') => setFilterRole(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="aspirant">Aspirants</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(value: 'all' | 'verified' | 'unverified') => setFilterStatus(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                  Total Users: {users?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {users?.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-green-200">
                            <AvatarImage src={user.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs sm:text-sm">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{user.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge 
                                className={`text-xs ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                  user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}
                              >
                                {user.role}
                              </Badge>
                              {user.is_verified && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {user.badge && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  Talent Badge
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {user.role === 'student' && (
                            <>
                              <Button
                                size="sm"
                                variant={user.is_verified ? "outline" : "default"}
                                onClick={() => handleVerifyUser(user.id, !user.is_verified)}
                                className="text-xs"
                              >
                                {user.is_verified ? (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Unverify
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verify
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant={user.badge ? "outline" : "secondary"}
                                onClick={() => handleToggleBadge(user.id, user.badge)}
                                className="text-xs"
                              >
                                {user.badge ? 'Remove Badge' : 'Add Badge'}
                              </Button>
                            </>
                          )}
                          
                          <Select
                            value={user.role}
                            onValueChange={(newRole: UserRole) => handleChangeRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-24 sm:w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="aspirant">Aspirant</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                          {user.departments && (
                            <span>Dept: {user.departments.name}</span>
                          )}
                          {user.jamb_reg && (
                            <span>JAMB: {user.jamb_reg}</span>
                          )}
                          {user.quiz_score && (
                            <span>Quiz Score: {user.quiz_score}%</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {users?.length === 0 && (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No Users Found</h3>
                    <p className="text-sm text-gray-600">
                      {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                        ? 'No users match your current filters.'
                        : 'No users have registered yet.'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
