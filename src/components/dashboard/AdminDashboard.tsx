import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, MessageCircle, AlertTriangle, TrendingUp, UserCheck, Shield, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminModerationPanel from './AdminModerationPanel';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const tabsListRef = useRef<HTMLDivElement>(null);

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

  // Fetch total users
  const { data: totalUsers } = useQuery({
    queryKey: ['admin-total-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch verified students
  const { data: verifiedStudents } = useQuery({
    queryKey: ['admin-verified-students'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_verified', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch total sessions
  const { data: totalSessions } = useQuery({
    queryKey: ['admin-total-sessions'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch flagged messages
  const { data: flaggedMessages } = useQuery({
    queryKey: ['admin-flagged-messages'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_flagged', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage and monitor the UNIOSUN Tutoring Platform</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-green-600">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Students</p>
                  <p className="text-2xl font-bold text-green-600">{verifiedStudents}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-green-600">{totalSessions}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Flagged Messages</p>
                  <p className="text-2xl font-bold text-red-600">{flaggedMessages}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
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
                <TrendingUp className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                data-value="users"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="moderation" 
                data-value="moderation"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Shield className="w-4 h-4 mr-2" />
                Moderation
              </TabsTrigger>
              <TabsTrigger 
                value="sessions" 
                data-value="sessions"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                data-value="settings"
                className="flex-shrink-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">User Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-medium">{totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified Students:</span>
                        <span className="font-medium">{verifiedStudents}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Activity Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Sessions:</span>
                        <span className="font-medium">{totalSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flagged Messages:</span>
                        <span className="font-medium text-red-600">{flaggedMessages}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <AdminModerationPanel />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Session management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Platform settings will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
