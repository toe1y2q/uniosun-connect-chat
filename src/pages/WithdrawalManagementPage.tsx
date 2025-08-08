
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
import { Wallet, DollarSign, CheckCircle, XCircle, Clock, ArrowLeft, Search, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';

const WithdrawalManagementPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'requested' | 'processing' | 'paid' | 'failed'>('all');

  // Fetch all withdrawals (admin only)
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['all-withdrawals', searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          users!withdrawals_user_id_fkey (
            id,
            name,
            email,
            profile_image
          )
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`account_name.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`);
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin'
  });

  // Update withdrawal status mutation
  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, status, reference }: { withdrawalId: string; status: string; reference?: string }) => {
      const updates: any = { status };
      if (reference) {
        updates.flutterwave_reference = reference;
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', withdrawalId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Updated",
        description: "Withdrawal status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['all-withdrawals'] });
    },
    onError: (error) => {
      console.error('Update withdrawal error:', error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = (withdrawalId: string, newStatus: string) => {
    updateWithdrawalMutation.mutate({
      withdrawalId,
      status: newStatus
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
       case 'paid':
         return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
       case 'paid':
         return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
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

  const totalAmount = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
  const completedAmount = withdrawals?.filter(w => w.status === 'paid').reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
  const pendingAmount = withdrawals?.filter(w => w.status === 'requested').reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
                <p className="text-xs sm:text-sm text-gray-600">Monitor and manage user withdrawal requests</p>
              </div>
              <Badge className="bg-red-100 text-red-800 self-start sm:self-center">
                <Wallet className="w-4 h-4 mr-1" />
                Admin Panel
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Withdrawals</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">₦{(totalAmount / 100).toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">₦{(completedAmount / 100).toLocaleString()}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-600">₦{(pendingAmount / 100).toLocaleString()}</p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by account name/number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                  Total Requests: {withdrawals?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawals List */}
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
              {withdrawals?.map((withdrawal) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        {/* User Info & Amount */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-green-200">
                            <AvatarImage src={withdrawal.users?.profile_image} />
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs sm:text-sm">
                              {withdrawal.users?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                              <h4 className="font-semibold text-sm sm:text-base">{withdrawal.users?.name}</h4>
                              <div className="text-lg sm:text-xl font-bold text-green-600">
                                ₦{(withdrawal.amount / 100).toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">{withdrawal.users?.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getStatusColor(withdrawal.status)}`}>
                                {getStatusIcon(withdrawal.status)}
                                <span className="ml-1 capitalize">{withdrawal.status}</span>
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(withdrawal.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {withdrawal.status === 'requested' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'processing')}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                Process
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'failed')}
                                className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {withdrawal.status === 'processing' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'paid')}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(withdrawal.id, 'failed')}
                                className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Mark Failed
                              </Button>
                            </>
                          )}

                          <Select
                            value={withdrawal.status}
                            onValueChange={(newStatus) => handleStatusUpdate(withdrawal.id, newStatus)}
                          >
                            <SelectTrigger className="w-24 sm:w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="requested">Requested</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Account:</span> {withdrawal.account_name}
                          </div>
                          <div>
                            <span className="font-medium">Number:</span> {withdrawal.account_number}
                          </div>
                          <div>
                            <span className="font-medium">Bank:</span> {withdrawal.bank_code}
                          </div>
                        </div>
                        {withdrawal.flutterwave_reference && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Reference:</span> {withdrawal.flutterwave_reference}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {withdrawals?.length === 0 && (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No Withdrawal Requests</h3>
                    <p className="text-sm text-gray-600">
                      {searchTerm || filterStatus !== 'all'
                        ? 'No withdrawal requests match your current filters.'
                        : 'No withdrawal requests have been made yet.'
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

export default WithdrawalManagementPage;
