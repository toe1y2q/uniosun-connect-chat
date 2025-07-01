
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { Navigate } from 'react-router-dom';

const WithdrawalManagementPage = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch all withdrawal requests
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['all-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users!withdrawals_user_id_fkey (name, email, profile_image)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Update withdrawal status
  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, status }: { withdrawalId: string; status: string }) => {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', withdrawalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Updated",
        description: "Withdrawal status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['all-withdrawals'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive"
      });
    }
  });

  const handleWithdrawalAction = (withdrawalId: string, status: string) => {
    updateWithdrawalMutation.mutate({ withdrawalId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'requested': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pendingWithdrawals = withdrawals?.filter(w => w.status === 'requested') || [];
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
          <p className="text-gray-600">Manage withdrawal requests from talents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{pendingWithdrawals.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">₦{(totalPendingAmount / 100).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{withdrawals?.length || 0}</p>
                </div>
                <CreditCard className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Withdrawal Requests
            </CardTitle>
            <CardDescription>
              Review and manage withdrawal requests from talents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals?.map((withdrawal) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                      <Avatar className="h-12 w-12 border-2 border-gray-200">
                        <AvatarImage src={withdrawal.users?.profile_image} />
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {withdrawal.users?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base">{withdrawal.users?.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{withdrawal.users?.email}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <div className="text-lg font-bold text-green-600">
                            ₦{(withdrawal.amount / 100).toLocaleString()}
                          </div>
                          <Badge className={getStatusColor(withdrawal.status)}>
                            {getStatusIcon(withdrawal.status)}
                            <span className="ml-1 capitalize">{withdrawal.status}</span>
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <p>Bank: {withdrawal.account_name} - {withdrawal.account_number}</p>
                          <p>Requested: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {withdrawal.status === 'requested' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs flex-1 sm:flex-none"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 text-xs flex-1 sm:flex-none"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {withdrawals?.length === 0 && (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No withdrawal requests</h3>
                    <p className="text-gray-600">Withdrawal requests will appear here when submitted</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalManagementPage;
