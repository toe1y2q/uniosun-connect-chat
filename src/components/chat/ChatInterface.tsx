import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Clock, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MessageItem from './MessageItem';
import { useContentFilter } from '@/hooks/useContentFilter';

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  replied_to?: string;
  is_flagged_content?: boolean;
  flagged_content_reason?: string;
}

interface User {
  id: string;
  name: string;
  profile_image?: string;
}

interface Session {
  id: string;
  duration: number;
  scheduled_at: string;
  status: string;
  client_id: string;
  student_id: string;
  amount: number;
}

interface ChatInterfaceProps {
  sessionId: string;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const { isMessageAllowed } = useContentFilter();

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<Session> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch users for the session
  const { data: users } = useQuery({
    queryKey: ['session-users', session?.client_id, session?.student_id],
    queryFn: async (): Promise<User[]> => {
      if (!session) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, profile_image')
        .in('id', [session.client_id, session.student_id]);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!session
  });

  // Calculate time left
  useEffect(() => {
    if (!session) return;

    const sessionStart = new Date(session.scheduled_at);
    const sessionEnd = new Date(sessionStart.getTime() + (session.duration * 60 * 1000));
    
    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, sessionEnd.getTime() - now.getTime());
      
      if (remaining === 0 && !sessionEnded) {
        setSessionEnded(true);
        handleSessionEnd();
      }
      
      setTimeLeft(Math.floor(remaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, sessionEnded]);

  const handleSessionEnd = async () => {
    try {
      // Update session status to completed
      await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      toast.info('Session has ended. Please provide your review.');
      
      // Navigate to rating page if user is aspirant (client)
      if (user?.id === session?.client_id) {
        navigate(`/rating-review/${sessionId}`);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; replied_to?: string }) => {
      // Check content filtering
      const contentCheck = isMessageAllowed(messageData.message);
      if (!contentCheck.allowed) {
        throw new Error(contentCheck.reason || 'Message not allowed');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user?.id!,
          message: messageData.message,
          replied_to: messageData.replied_to || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      setMessage('');
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .update({ message: '[Message deleted]', is_flagged_content: true })
        .eq('id', messageId)
        .eq('sender_id', user?.id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      toast.success('Message deleted');
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() || sessionEnded) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      replied_to: replyingTo
    });
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getReplyingToMessage = (messageId: string) => {
    return (messages as ChatMessage[])?.find(m => m.id === messageId);
  };

  const getMessageSender = (senderId: string) => {
    return (users as User[])?.find(u => u.id === senderId);
  };

  if (sessionLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-semibold">Tutoring Session</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {sessionEnded ? (
                  <Badge variant="destructive">Session Ended</Badge>
                ) : (
                  <span>Time left: {formatTime(timeLeft)}</span>
                )}
              </div>
            </div>
          </div>
          
          {session && (
            <div className="text-right">
              <p className="text-sm font-medium">₦{(session.amount / 100).toLocaleString()}</p>
              <p className="text-xs text-gray-600">{session.duration} minutes</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            sender={getMessageSender(msg.sender_id)}
            isCurrentUser={msg.sender_id === user?.id}
            replyingToMessage={msg.replied_to ? getReplyingToMessage(msg.replied_to) : undefined}
            replyingToSender={msg.replied_to ? getMessageSender(getReplyingToMessage(msg.replied_to)?.sender_id || '') : undefined}
            onReply={handleReply}
            onDelete={handleDeleteMessage}
          />
        ))}
        
        {sessionEnded && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-orange-800 font-medium">Session has ended</p>
              <p className="text-orange-600 text-sm">
                {user?.id === session?.client_id && 'Please provide your review to complete the session.'}
              </p>
            </CardContent>
          </Card>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!sessionEnded && (
        <div className="bg-white border-t p-4">
          {replyingTo && (
            <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    Replying to {getMessageSender(getReplyingToMessage(replyingTo)?.sender_id || '')?.name}
                  </p>
                  <p className="text-sm text-gray-700 truncate">
                    {getReplyingToMessage(replyingTo)?.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message... (academic topics only)"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            Messages are filtered to ensure academic-focused discussions
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
