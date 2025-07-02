import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, MessageSquare, DollarSign, Calendar, Star } from 'lucide-react';
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

      // Fetch recent sessions for the user
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          client:users!sessions_client_id_fkey (name),
          student:users!sessions_student_id_fkey (name)
        `)
        .or(`client_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      // Convert sessions to notifications
      sessions?.forEach(session => {
        const isClient = session.client_id === user.id;
        const otherUser = isClient ? session.student : session.client;
        
        if (session.status === 'confirmed') {
          notifications.push({
            id: `session-${session.id}`,
            type: 'session',
            message: `Session with ${otherUser?.name} is confirmed for ${new Date(session.scheduled_at).toLocaleDateString()}`,
            time: session.created_at,
            icon: Calendar,
            unread: true
          });
        } else if (session.status === 'completed' && isClient) {
          notifications.push({
            id: `session-completed-${session.id}`,
            type: 'session',
            message: `Session with ${otherUser?.name} completed. Please submit your review.`,
            time: session.updated_at || session.created_at,
            icon: Star,
            unread: true
          });
        }
      });

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      transactions?.forEach(transaction => {
        if (transaction.type === 'earning' && transaction.status === 'completed') {
          notifications.push({
            id: `earning-${transaction.id}`,
            type: 'payment',
            message: `You received ₦${(transaction.amount / 100).toLocaleString()} for tutoring session`,
            time: transaction.created_at,
            icon: DollarSign,
            unread: true
          });
        } else if (transaction.type === 'payment' && transaction.status === 'completed') {
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

      // Fetch recent reviews if user is a student
      if (profile?.role === 'student') {
        const { data: reviews } = await supabase
          .from('reviews')
          .select(`
            *,
            sessions!inner(student_id)
          `)
          .eq('sessions.student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        reviews?.forEach(review => {
          notifications.push({
            id: `review-${review.id}`,
            type: 'review',
            message: `You received a ${review.rating}-star review: "${review.comment?.substring(0, 50)}${review.comment && review.comment.length > 50 ? '...' : ''}"`,
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
    if (notification.type === 'session' && notification.message.includes('Please submit your review')) {
      // Extract session ID from notification ID
      const sessionId = notification.id.replace('session-completed-', '');
      window.location.href = `/chat/${sessionId}`;
    } else if (notification.type === 'session') {
      window.location.href = '/dashboard';
    } else if (notification.type === 'payment') {
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
                         'bg-yellow-100'
                       }`}>
                         <IconComponent className={`w-4 h-4 ${
                           notification.type === 'payment' ? 'text-green-600' :
                           notification.type === 'session' ? 'text-blue-600' :
                           'text-yellow-600'
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