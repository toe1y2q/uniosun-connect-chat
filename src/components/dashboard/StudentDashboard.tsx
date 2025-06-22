
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MessageSquare, TrendingUp, Users, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';
import WalletSection from '@/components/wallet/WalletSection';

const StudentDashboard = () => {
  const { profile } = useAuth();

  const { data: sessions } = useQuery({
    queryKey: ['student-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:users!sessions_client_id_fkey(name, email)
        `)
        .eq('student_id', profile.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const { data: earnings } = useQuery({
    queryKey: ['student-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('type', 'earning')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const upcomingSessions = sessions?.filter(s => 
    new Date(s.scheduled_at) > new Date() && s.status === 'confirmed'
  ) || [];
  
  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
  const totalEarnings = earnings?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const walletBalance = profile?.wallet_balance || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your tutoring sessions and track your earnings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(walletBalance / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available for withdrawal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(totalEarnings / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingSessions.length}</div>
              <p className="text-xs text-muted-foreground">Sessions scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedSessions.length}</div>
              <p className="text-xs text-muted-foreground">Sessions completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="wallet">Wallet & Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>
                  Your scheduled tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Calendar className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{session.client?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                              {new Date(session.scheduled_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">Duration: {session.duration} minutes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1 capitalize">{session.status}</span>
                          </Badge>
                          <p className="text-sm font-semibold mt-1">
                            ₦{((session.amount * 0.7) / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                    <p className="text-gray-600">Your scheduled sessions will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your completed and past sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions?.length ? (
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{session.client?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1 capitalize">{session.status}</span>
                          </Badge>
                          <p className="text-sm font-semibold mt-1">
                            ₦{((session.amount * 0.7) / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                    <p className="text-gray-600">Your tutoring sessions will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <WalletSection />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and verification status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">Name: <span className="font-normal">{profile?.name}</span></p>
                </div>
                <div>
                  <p className="font-semibold">Email: <span className="font-normal">{profile?.email}</span></p>
                </div>
                <div>
                  <p className="font-semibold">Role: <span className="font-normal capitalize">{profile?.role}</span></p>
                </div>
                <div>
                  <p className="font-semibold">Status: 
                    <Badge className="ml-2" variant={profile?.is_verified ? 'default' : 'secondary'}>
                      {profile?.is_verified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </p>
                </div>
                {profile?.quiz_score && (
                  <div>
                    <p className="font-semibold">Quiz Score: <span className="font-normal">{profile.quiz_score}%</span></p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
