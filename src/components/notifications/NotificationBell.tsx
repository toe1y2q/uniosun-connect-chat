
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'session' | 'payment' | 'review' | 'system';
  isRead: boolean;
}

const NotificationBell = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch real notification data based on user activities
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!profile?.id) return [];

      const notifications: Notification[] = [];

      // Fetch recent sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id, 
          status, 
          scheduled_at, 
          amount,
          client:users!sessions_client_id_fkey(name),
          student:users!sessions_student_id_fkey(name)
        `)
        .or(`client_id.eq.${profile.id},student_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      sessions?.forEach(session => {
        if (session.status === 'confirmed') {
          notifications.push({
            id: `session-${session.id}`,
            title: 'Session Confirmed',
            message: profile.role === 'student' 
              ? `Session with ${session.client?.name} has been confirmed`
              : `Session with ${session.student?.name} has been confirmed`,
            time: new Date(session.scheduled_at).toLocaleDateString(),
            type: 'session',
            isRead: false
          });
        }
      });

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, type, status, created_at, description')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(3);

      transactions?.forEach(transaction => {
        if (transaction.type === 'earning') {
          notifications.push({
            id: `payment-${transaction.id}`,
            title: 'Payment Received',
            message: `You received ₦${transaction.amount.toLocaleString()} for your tutoring session`,
            time: new Date(transaction.created_at).toLocaleDateString(),
            type: 'payment',
            isRead: false
          });
        }
      });

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          id, 
          rating, 
          comment, 
          created_at,
          session:sessions(
            client:users!sessions_client_id_fkey(name),
            student:users!sessions_student_id_fkey(name)
          )
        `)
        .eq('reviewer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      reviews?.forEach(review => {
        notifications.push({
          id: `review-${review.id}`,
          title: 'Review Submitted',
          message: `You left a ${review.rating}-star review`,
          time: new Date(review.created_at).toLocaleDateString(),
          type: 'review',
          isRead: false
        });
      });

      // Sort by most recent first
      return notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    },
    enabled: !!profile?.id
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session': return '📅';
      case 'payment': return '💰';
      case 'review': return '⭐';
      default: return '🔔';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{getNotificationIcon(notification.type)}</span>
                            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              )}
            </div>
            <div className="border-t p-3">
              <Button variant="ghost" className="w-full text-sm">
                View All Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
