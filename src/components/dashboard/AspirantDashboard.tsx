import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, MessageCircle, Star, User, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AspirantSessionsSection from '@/components/sessions/AspirantSessionsSection';
import ReviewsList from '@/components/reviews/ReviewsList';
import AspirantWallet from '@/components/wallet/AspirantWallet';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Fetch active sessions for the aspirant
  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (id, name, profile_image)
        `)
        .eq('client_id', profile?.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all sessions for the aspirant
  const { data: allSessions } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (id, name, profile_image)
        `)
        .eq('client_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch reviews given by the aspirant
  const { data: reviews } = useQuery({
    queryKey: ['aspirant-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Auto-scroll tabs function
  const scrollToActiveTab = (tabValue: string) => {
    if (!tabsListRef.current) return;
    
    const activeButton = tabsListRef.current.querySelector(`[data-value="${tabValue}"]`) as HTMLElement;
    if (activeButton) {
      const container = tabsListRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Check if button is outside the visible area
      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        const scrollLeft = activeButton.offsetLeft - (container.clientWidth / 2) + (activeButton.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    scrollToActiveTab(activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <AvatarUpload size="sm" showUploadButton={false} className="flex-shrink-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {profile?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600">Ready to learn something new today?</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/talents')}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              Find Talents
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-green-600">{activeSessions?.length || 0}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-green-600">{allSessions?.length || 0}</p>
                  </div>
                  <CalendarDays className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Reviews Given</p>
                    <p className="text-2xl font-bold text-green-600">{reviews?.length || 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <TabsList 
              ref={tabsListRef}
              className="w-full justify-start overflow-x-auto scrollbar-hide bg-white border border-green-200 p-1 rounded-lg"
              style={{ 
                display: 'flex',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <TabsTrigger 
                value="overview" 
                data-value="overview"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="sessions" 
                data-value="sessions"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                My Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                data-value="reviews"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Star className="w-4 h-4 mr-2" />
                My Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="wallet" 
                data-value="wallet"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Sessions */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions && activeSessions.length > 0 ? (
                  <div className="space-y-3">
                    {activeSessions.slice(0, 3).map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900">{session.student?.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent sessions</p>
                    <Button 
                      onClick={() => navigate('/talents')}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Book Your First Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <AspirantSessionsSection />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsList />
          </TabsContent>

          <TabsContent value="wallet">
            <AspirantWallet />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AspirantDashboard;
