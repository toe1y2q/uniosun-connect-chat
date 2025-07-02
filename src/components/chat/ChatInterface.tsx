
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Clock, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContentFilter } from '@/hooks/useContentFilter';
import MessageItem from './MessageItem';

interface ChatInterfaceProps {
  sessionId: string;
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  replied_to?: string;
  is_flagged?: boolean;
  is_flagged_content?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBack }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMessageAllowed } = useContentFilter();

  // Fetch session details
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:users!sessions_client_id_fkey (id, name, profile_image),
          student:users!sessions_student_id_fkey (id, name, profile_image)
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', sessionId],
    queryFun: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 3000
  });

  // Check if review exists for this session
  const { data: existingReview } = useQuery({
    queryKey: ['review', sessionId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('reviewer_id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refetchMessages]);

  // Session timer and management
  useEffect(() => {
    if (session && session.status === 'confirmed') {
      const sessionDuration = session.duration * 60 * 1000;
      const scheduledTime = new Date(session.scheduled_at).getTime();
      const now = Date.now();
      
      const sessionStartTime = scheduledTime - (5 * 60 * 1000);
      const sessionEndTime = scheduledTime + sessionDuration;
      
      if (now >= sessionStartTime && now <= sessionEndTime) {
        setSessionStarted(true);
        const remaining = sessionEndTime - now;
        setTimeLeft(Math.max(0, remaining));
        
        const timer = setInterval(() => {
          const remaining = sessionEndTime - Date.now();
          if (remaining <= 0) {
            setTimeLeft(0);
            setSessionEnded(true);
            clearInterval(timer);
            
            // Auto-redirect aspirant to rating page if no review exists
            if (profile?.role === 'aspirant' && !existingReview) {
              toast.info('Session ended. Please rate your experience.');
              setTimeout(() => {
                navigate(`/review/${sessionId}`);
              }, 2000);
            }
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
        
        return () => clearInterval(timer);
      } else if (now < sessionStartTime) {
        const timeUntilStart = sessionStartTime - now;
        setTimeLeft(timeUntilStart);
        
        const timer = setInterval(() => {
          const remaining = sessionStartTime - Date.now();
          if (remaining <= 0) {
            setSessionStarted(true);
            clearInterval(timer);
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [session, sessionId, navigate, profile?.role, existingReview]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    // Content filtering
    const filterResult = isMessageAllowed(newMessage);
    if (!filterResult.allowed) {
      toast.error(filterResult.reason);
      return;
    }

    // Check if session has ended
    if (sessionEnded) {
      toast.error('Session has ended. You cannot send messages.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user?.id,
          message: newMessage.trim(),
          replied_to: replyingTo?.id || null
        });

      if (error) throw error;

      setNewMessage('');
      setReplyingTo(null);
      refetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseChat = () => {
    // Mandatory rating for aspirants
    if (profile?.role === 'aspirant' && !existingReview && (sessionEnded || session?.status === 'completed')) {
      navigate(`/review/${sessionId}`);
    } else {
      onBack();
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleMessageDeleted = () => {
    refetchMessages();
  };

  const otherParticipant = session?.client_id === user?.id ? session?.student : session?.client;
  const isAspirant = profile?.role === 'aspirant';

  const formatTimeLeft = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCloseChat}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profile_image} />
              <AvatarFallback>
                {otherParticipant?.name?.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{otherParticipant?.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {session?.duration} min session
                </Badge>
                <Badge 
                  className={`text-xs ${
                    sessionEnded ? 'bg-red-100 text-red-800' :
                    session?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    session?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {sessionEnded ? 'Ended' : session?.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Timer */}
            {timeLeft !== null && !sessionEnded && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {sessionStarted ? (
                    timeLeft > 0 ? `${formatTimeLeft(timeLeft)} left` : 'Session ended'
                  ) : (
                    `Starts in ${formatTimeLeft(timeLeft)}`
                  )}
                </span>
              </div>
            )}

            {/* Session ended indicator */}
            {sessionEnded && (
              <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Session Ended</span>
              </div>
            )}

            {/* Rate session button for aspirants */}
            {isAspirant && !existingReview && sessionEnded && (
              <Button
                onClick={() => navigate(`/review/${sessionId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                Rate Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => {
            const repliedMessage = message.replied_to 
              ? messages.find(m => m.id === message.replied_to)
              : undefined;

            return (
              <MessageItem
                key={message.id}
                message={message}
                otherParticipant={otherParticipant}
                currentUser={user}
                onReply={handleReply}
                onMessageDeleted={handleMessageDeleted}
                repliedMessage={repliedMessage}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {replyingTo && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-700">Replying to:</p>
                <p className="text-gray-600 truncate">{replyingTo.message}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {sessionEnded ? (
          <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">Session has ended</p>
            {isAspirant && !existingReview && (
              <Button 
                onClick={() => navigate(`/review/${sessionId}`)}
                className="ml-4 bg-green-600 hover:bg-green-700"
              >
                Rate Session
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your academic question or response..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
