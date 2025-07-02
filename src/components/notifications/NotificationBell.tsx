
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, MessageSquare, DollarSign, Calendar, Star, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const NotificationBell = () => {
  const { user, profile } = useAuth();

  // Fetch user notifications based on their activities
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const notifications: any[] = [];

      if (profile?.role === 'aspirant') {
        // Fetch recent sessions for aspirants
        const { data: sessions } = await supabase
          .from('sessions')
          .select(`
            *,
            student:users!sessions_student_id_fkey (name),
            reviews!reviews_session_id_fkey (id)
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        sessions?.forEach(session => {
          if (session.status === 'confirmed') {
            notifications.push({
              id: `session-${session.id}`,
              type: 'session',
              message: `Session with ${session.student?.name} is confirmed for ${new Date(session.scheduled_at).toLocaleDateString()}`,
              time: session.created_at,
              icon: Calendar,
              unread: true,
              sessionId: session.id
            });
          } else if (session.status === 'completed' && !session.reviews?.length) {
            notifications.push({
              id: `review-needed-${session.id}`,
              type: 'review',
              message: `Please rate your session with ${session.student?.name}`,
              time: session.updated_at || session.created_at,
              icon: Star,
              unread: true,
              sessionId: session.id
            });
          }
        });

        // Fetch recent payment transactions for aspirants
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'payment')
          .order('created_at', { ascending: false })
          .limit(5);

        transactions?.forEach(transaction => {
          if (transaction.status === 'completed') {
            notifications.push({
              id: `payment-${transaction.id}`,
              type: 'payment',
              message: `Payment of ₦${(transaction.amount / 100).toLocaleString()} processed successfully`,
              time: transaction.created_at,
              icon: DollarSign,
              unread: true
            });
          }
        });
      }

      if (profile?.role === 'student') {
        // Fetch sessions where student is the tutor
        const { data: sessions } = await supabase
          .from('sessions')
          .select(`
            *,
            client:users!sessions_client_id_fkey (name)
          `)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        sessions?.forEach(session => {
          if (session.status === 'confirmed') {
            notifications.push({
              id: `session-booked-${session.id}`,
              type: 'session',
              message: `New session booked by ${session.client?.name} for ${new Date(session.scheduled_at).toLocaleDateString()}`,
              time: session.created_at,
              icon: BookOpen,
              unread: true,
              sessionId: session.id
            });
          } else if (session.status === 'completed') {
            notifications.push({
              id: `session-completed-${session.id}`,
              type: 'session',
              message: `Session with ${session.client?.name} completed successfully`,
              time: session.updated_at || session.created_at,
              icon: Calendar,
              unread: true,
              sessionId: session.id
            });
          }
        });

        // Fetch earning transactions for students
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'earning')
          .order('created_at', { ascending: false })
          .limit(5);

        transactions?.forEach(transaction => {
          if (transaction.status === 'completed') {
            notifications.push({
              id: `earning-${transaction.id}`,
              type: 'payment',
              message: `You received ₦${(transaction.amount / 100).toLocaleString()} for tutoring session`,
              time: transaction.created_at,
              icon: DollarSign,
              unread: true
            });
          }
        });

        // Fetch reviews received as a student/tutor
        const { data: reviews } = await supabase
          .from('reviews')
          .select(`
            *,
            sessions!inner(student_id, client:users!sessions_client_id_fkey(name))
          `)
          .eq('sessions.student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        reviews?.forEach(review => {
          notifications.push({
            id: `review-received-${review.id}`,
            type: 'review',
            message: `You received a ${review.rating}-star review from ${review.sessions.client?.name}`,
            time: review.created_at,
            icon: Star,
            unread: true
          });
        });
      }

      // Sort by time
      return notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const unreadCount = notifications?.filter(n => n.unread).length || 0;

  const getTimeAgo = (time: string) => {
    const now = new Date();
    const notificationTime = new Date(time);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'review' && notification.message.includes('Please rate')) {
      // Navigate to review page
      window.location.href = `/review/${notification.sessionId}`;
    } else if (notification.type === 'session' && notification.sessionId) {
      // Navigate to chat for the session
      window.location.href = `/chat/${notification.sessionId}`;
    } else {
      // Navigate to dashboard for other notifications
      window.location.href = '/dashboard';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">{unreadCount} unread</p>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => {
                const IconComponent = notification.icon;
                return (
                   <div 
                     key={notification.id} 
                     className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                     onClick={() => handleNotificationClick(notification)}
                   >
                     <div className="flex items-start gap-3">
                       <div className={`p-2 rounded-full ${
                         notification.type === 'payment' ? 'bg-green-100' :
                         notification.type === 'session' ? 'bg-blue-100' :
                         notification.type === 'review' ? 'bg-yellow-100' :
                         'bg-gray-100'
                       }`}>
                         <IconComponent className={`w-4 h-4 ${
                           notification.type === 'payment' ? 'text-green-600' :
                           notification.type === 'session' ? 'text-blue-600' :
                           notification.type === 'review' ? 'text-yellow-600' :
                           'text-gray-600'
                         }`} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm text-gray-900 mb-1">
                           {notification.message}
                         </p>
                         <p className="text-xs text-gray-500">
                           {getTimeAgo(notification.time)}
                         </p>
                       </div>
                       {notification.unread && (
                         <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                       )}
                     </div>
                   </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
