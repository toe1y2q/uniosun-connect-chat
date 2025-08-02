
import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Calendar } from 'lucide-react';

const NotificationSystem = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    // Listen for new chat messages
    const messagesChannel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if this message is in a session the user is part of
          const { data: session } = await supabase
            .from('sessions')
            .select('client_id, student_id, client:users!sessions_client_id_fkey(name), student:users!sessions_student_id_fkey(name)')
            .eq('id', newMessage.session_id)
            .single();

          if (session && (session.client_id === user.id || session.student_id === user.id)) {
            const senderName = session.client_id === newMessage.sender_id 
              ? session.client?.name 
              : session.student?.name;

            toast.success(`New message from ${senderName}`, {
              icon: <MessageSquare className="w-4 h-4" />,
              action: {
                label: 'View',
                onClick: () => window.location.href = `/chat/${newMessage.session_id}`
              }
            });
          }
        }
      )
      .subscribe();

    // Listen for new session bookings (for students)
    const sessionsChannel = supabase
      .channel('user-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions',
        },
        async (payload) => {
          const newSession = payload.new;
          
          // Notify student about new booking
          if (newSession.student_id === user.id && profile.role === 'student') {
            const { data: client } = await supabase
              .from('users')
              .select('name')
              .eq('id', newSession.client_id)
              .single();

            toast.success(`New session booked by ${client?.name}`, {
              icon: <Calendar className="w-4 h-4" />,
              action: {
                label: 'View',
                onClick: () => window.location.href = '/dashboard'
              }
            });
          }
        }
      )
      .subscribe();

    // Listen for session status updates
    const sessionUpdatesChannel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
        },
        async (payload) => {
          const updatedSession = payload.new;
          const oldSession = payload.old;
          
          // Check if user is part of this session
          if (updatedSession.client_id !== user.id && updatedSession.student_id !== user.id) return;

          // Notify about status changes
          if (oldSession.status !== updatedSession.status) {
            let message = '';
            
            if (updatedSession.status === 'confirmed') {
              // Fetch the other participant's name
              const otherUserId = updatedSession.client_id === user.id 
                ? updatedSession.student_id 
                : updatedSession.client_id;
              
              const { data: otherUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', otherUserId)
                .single();

              message = `Session with ${otherUser?.name || 'Unknown'} confirmed! You can now start chatting.`;
            } else if (updatedSession.status === 'cancelled') {
              // Fetch the other participant's name
              const otherUserId = updatedSession.client_id === user.id 
                ? updatedSession.student_id 
                : updatedSession.client_id;
              
              const { data: otherUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', otherUserId)
                .single();

              message = `Session with ${otherUser?.name || 'Unknown'} has been cancelled.`;
            } else if (updatedSession.status === 'completed') {
              // Fetch the other participant's name
              const otherUserId = updatedSession.client_id === user.id 
                ? updatedSession.student_id 
                : updatedSession.client_id;
              
              const { data: otherUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', otherUserId)
                .single();

              message = `Session with ${otherUser?.name || 'Unknown'} completed successfully.`;
            }

            if (message) {
              toast.info(message, {
                icon: <Calendar className="w-4 h-4" />,
                action: {
                  label: 'View',
                  onClick: () => window.location.href = '/dashboard'
                }
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(sessionUpdatesChannel);
    };
  }, [user, profile]);

  return null; // This component doesn't render anything
};

export default NotificationSystem;
