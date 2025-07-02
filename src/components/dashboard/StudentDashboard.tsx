
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Star, MessageSquare, TrendingUp } from 'lucide-react';
import SessionsSection from '@/components/sessions/SessionsSection';
import WalletSection from '@/components/wallet/WalletSection';
import ReviewsList from '@/components/reviews/ReviewsList';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch student statistics
  const { data: stats } = useQuery({
    queryKey: ['student-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const [sessionsRes, reviewsRes, earningsRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, status, amount')
          .eq('student_id', profile.id),
        supabase
          .from('reviews')
          .select('rating')
          .in('session_id', 
            supabase
              .from('sessions')
              .select('id')
              .eq('student_id', profile.id)
          ),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', profile.id)
          .eq('type', 'earning')
          .eq('status', 'completed')
      ]);

      const totalSessions = sessionsRes.data?.length || 0;
      const completedSessions = sessionsRes.data?.filter(s => s.status === 'completed').length || 0;
      const totalEarnings = earningsRes.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const avgRating = reviewsRes.data?.length 
        ? reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length 
        : 0;

      return {
        totalSessions,
        completedSessions,
        totalEarnings,
        avgRating: avgRating.toFixed(1),
        reviewCount: reviewsRes.data?.length || 0
      };
    },
    enabled: !!profile?.id
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
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name}!</h1>
          <p className="text-gray-600">Here's your tutoring dashboard</p>
        </div>
        {profile?.badge && (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            ⭐ Verified Tutor
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Sessions"
              value={stats?.totalSessions || 0}
              icon={Calendar}
              subtitle={`${stats?.completedSessions || 0} completed`}
            />
            <StatCard
              title="Total Earnings"
              value={`₦${stats?.totalEarnings?.toLocaleString() || 0}`}
              icon={DollarSign}
            />
            <StatCard
              title="Average Rating"
              value={stats?.avgRating || '0.0'}
              icon={Star}
              subtitle={`${stats?.reviewCount || 0} reviews`}
            />
            <StatCard
              title="Active Sessions"
              value={stats?.totalSessions - stats?.completedSessions || 0}
              icon={MessageSquare}
            />
          </div>

          {/* Performance Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {stats?.totalSessions ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Student Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-semibold">{stats?.avgRating || '0.0'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Status</span>
                    <Badge variant={profile?.status === 'active' ? 'default' : 'secondary'}>
                      {profile?.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('sessions')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Sessions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('wallet')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Check Earnings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('reviews')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  View Reviews
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsSection />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletSection />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
