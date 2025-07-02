import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  GraduationCap,
  Star,
  MessageSquare
} from 'lucide-react';

const PlatformAnalytics = () => {
  // Fetch platform analytics data
  const { data: analytics } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: async () => {
      // Get user statistics
      const { data: userStats } = await supabase
        .from('users')
        .select('role, created_at, is_verified, badge');

      // Get session statistics
      const { data: sessionStats } = await supabase
        .from('sessions')
        .select('amount, status, created_at');

      // Get transaction statistics
      const { data: transactionStats } = await supabase
        .from('transactions')
        .select('amount, type, status, created_at');

      // Get chat message statistics
      const { data: messageStats } = await supabase
        .from('chat_messages')
        .select('created_at');

      // Process data
      const totalUsers = userStats?.length || 0;
      const totalStudents = userStats?.filter(u => u.role === 'student').length || 0;
      const totalAspirants = userStats?.filter(u => u.role === 'aspirant').length || 0;
      const verifiedStudents = userStats?.filter(u => u.role === 'student' && u.is_verified).length || 0;
      const activeTutors = userStats?.filter(u => u.role === 'student' && u.badge).length || 0;

      const totalSessions = sessionStats?.length || 0;
      const completedSessions = sessionStats?.filter(s => s.status === 'completed').length || 0;
      const totalRevenue = sessionStats?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

      const totalTransactions = transactionStats?.length || 0;
      const totalMessages = messageStats?.length || 0;

      // Calculate growth rates (mock for now)
      const userGrowthRate = 15.2;
      const revenueGrowthRate = 23.8;
      const sessionGrowthRate = 18.5;

      return {
        totalUsers,
        totalStudents,
        totalAspirants,
        verifiedStudents,
        activeTutors,
        totalSessions,
        completedSessions,
        totalRevenue,
        totalTransactions,
        totalMessages,
        userGrowthRate,
        revenueGrowthRate,
        sessionGrowthRate
      };
    }
  });

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.totalUsers || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics?.userGrowthRate || 0}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics?.revenueGrowthRate || 0}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.totalSessions || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics?.sessionGrowthRate || 0}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.activeTutors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Certified and active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="w-5 h-5" />
              User Statistics
            </CardTitle>
            <CardDescription>
              Breakdown of platform users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Students</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.totalStudents || 0}</div>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {analytics?.verifiedStudents || 0} verified
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Aspirants</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.totalAspirants || 0}</div>
                <span className="text-xs text-gray-500">Active users</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Certified Tutors</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.activeTutors || 0}</div>
                <span className="text-xs text-gray-500">Teaching actively</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <BarChart3 className="w-5 h-5" />
              Platform Activity
            </CardTitle>
            <CardDescription>
              Recent platform engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Completed Sessions</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.completedSessions || 0}</div>
                <span className="text-xs text-gray-500">
                  of {analytics?.totalSessions || 0} total
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Total Transactions</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.totalTransactions || 0}</div>
                <span className="text-xs text-gray-500">All time</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Chat Messages</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analytics?.totalMessages || 0}</div>
                <span className="text-xs text-gray-500">Platform wide</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analytics?.completedSessions && analytics?.totalSessions 
                  ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100)
                  : 0}%
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">Session Completion Rate</div>
              <div className="text-xs text-gray-500">Sessions completed successfully</div>
            </div>

            <div className="text-center p-4 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analytics?.verifiedStudents && analytics?.totalStudents
                  ? Math.round((analytics.verifiedStudents / analytics.totalStudents) * 100)
                  : 0}%
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">Student Verification Rate</div>
              <div className="text-xs text-gray-500">Students verified by admin</div>
            </div>

            <div className="text-center p-4 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analytics?.activeTutors && analytics?.verifiedStudents
                  ? Math.round((analytics.activeTutors / analytics.verifiedStudents) * 100)
                  : 0}%
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">Tutor Certification Rate</div>
              <div className="text-xs text-gray-500">Verified students who became tutors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAnalytics;