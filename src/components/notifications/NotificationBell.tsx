
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const NotificationBell = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread notifications count (mock for now)
  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count', profile?.id],
    queryFn: async () => {
      // This would fetch actual notifications from database
      // For now, returning a mock count
      return 3;
    },
    enabled: !!profile?.id
  });

  const mockNotifications = [
    {
      id: 1,
      title: 'New Session Booked',
      message: 'You have a new tutoring session scheduled',
      time: '2 minutes ago',
      type: 'session'
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'You received ₦1,500 for your session',
      time: '1 hour ago',
      type: 'payment'
    },
    {
      id: 3,
      title: 'New Review',
      message: 'A student left you a 5-star review',
      time: '3 hours ago',
      type: 'review'
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount && notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notificationCount}
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
              {mockNotifications.length > 0 ? (
                <div className="space-y-1">
                  {mockNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
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
