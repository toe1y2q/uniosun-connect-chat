
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthContext';
import { CheckCircle, Clock, Wallet, BookOpen, MessageSquare, Award } from 'lucide-react';
import QuizSection from '../quiz/QuizSection';
import WalletSection from '../wallet/WalletSection';
import SessionsSection from '../sessions/SessionsSection';

const StudentDashboard = () => {
  const { profile } = useAuth();

  const getStatusInfo = () => {
    if (!profile?.is_verified) {
      return {
        status: 'Pending Verification',
        color: 'bg-yellow-500',
        icon: Clock,
        message: 'Your account is under review by admin'
      };
    }
    if (!profile?.badge) {
      return {
        status: 'Take Quiz',
        color: 'bg-blue-500',
        icon: BookOpen,
        message: 'Pass the quiz to start earning'
      };
    }
    return {
      status: 'Active Talent',
      color: 'bg-green-500',
      icon: Award,
      message: 'You can now receive bookings'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile?.name}!
              </h1>
              <p className="text-gray-600">Student Talent Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.status}
              </Badge>
            </div>
          </div>

          <Card className="mb-6 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${statusInfo.color} text-white`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{statusInfo.status}</h3>
                  <p className="text-gray-600">{statusInfo.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-green-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Quiz</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Sessions</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {profile?.quiz_score ? `${profile.quiz_score}%` : 'Not taken'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.quiz_score && profile.quiz_score >= 70 ? 'Passed' : 'Need 70% to pass'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-xs text-muted-foreground">
                    Ongoing conversations
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <Wallet className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₦0</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <QuizSection />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsSection />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
