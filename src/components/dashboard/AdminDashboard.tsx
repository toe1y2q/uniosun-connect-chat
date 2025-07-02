
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, DollarSign, AlertTriangle, Settings, CreditCard } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, sessionsRes, transactionsRes, appealsRes, withdrawalsRes] = await Promise.all([
        supabase.from('users').select('id, role, status', { count: 'exact' }),
        supabase.from('sessions').select('id, status, amount', { count: 'exact' }),
        supabase.from('transactions').select('id, amount, type', { count: 'exact' }),
        supabase.from('appeals').select('id, status', { count: 'exact' }),
        supabase.from('withdrawals').select('id, status, amount', { count: 'exact' })
      ]);

      const totalRevenue = transactionsRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const pendingWithdrawals = withdrawalsRes.data?.filter(w => w.status === 'requested').length || 0;
      const pendingAppeals = appealsRes.data?.filter(a => a.status === 'pending').length || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalRevenue,
        pendingWithdrawals,
        pendingAppeals,
        activeStudents: usersRes.data?.filter(u => u.role === 'student' && u.status === 'active').length || 0,
        activeAspirants: usersRes.data?.filter(u => u.role === 'aspirant' && u.status === 'active').length || 0
      };
    }
  });

  // Fetch recent activities
  const { data: recentSessions } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          amount,
          scheduled_at,
          created_at,
          client:users!sessions_client_id_fkey(name, email),
          student:users!sessions_student_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  const StatCard = ({ title, value, icon: Icon, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
          <TabsTrigger value="settings">Live Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              subtitle={`${stats?.activeStudents || 0} students, ${stats?.activeAspirants || 0} aspirants`}
            />
            <StatCard
              title="Total Sessions"
              value={stats?.totalSessions || 0}
              icon={GraduationCap}
            />
            <StatCard
              title="Total Revenue"
              value={`₦${stats?.totalRevenue?.toLocaleString() || 0}`}
              icon={DollarSign}
            />
            <StatCard
              title="Pending Actions"
              value={`${(stats?.pendingWithdrawals || 0) + (stats?.pendingAppeals || 0)}`}
              icon={AlertTriangle}
              subtitle={`${stats?.pendingWithdrawals || 0} withdrawals, ${stats?.pendingAppeals || 0} appeals`}
            />
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSessions?.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {session.client?.name} → {session.student?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.scheduled_at).toLocaleDateString()} • ₦{session.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      session.status === 'completed' ? 'default' :
                      session.status === 'confirmed' ? 'secondary' :
                      session.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Withdrawal Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Withdrawal management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals">
          <Card>
            <CardHeader>
              <CardTitle>Appeals Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Appeals management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Live Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Live settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
