
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Send, Star, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBack }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 3000 // Refresh every 3 seconds
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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

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
    // Check if user is aspirant and hasn't reviewed yet
    if (profile?.role === 'aspirant' && !existingReview && session?.status === 'confirmed') {
      // Redirect to rating page
      navigate(`/review/${sessionId}`);
    } else {
      onBack();
    }
  };

  const otherParticipant = session?.client_id === user?.id ? session?.student : session?.client;
  const isAspirant = profile?.role === 'aspirant';

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
                    session?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    session?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {session?.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Show review reminder for aspirants */}
          {isAspirant && !existingReview && session?.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => navigate(`/review/${sessionId}`)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Star className="w-4 h-4 mr-2" />
              Rate Session
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            const repliedMessage = message.replied_to 
              ? messages.find(m => m.id === message.replied_to)
              : null;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {repliedMessage && (
                    <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600 border-l-2 border-green-500">
                      <p className="font-medium">Replying to:</p>
                      <p className="truncate">{repliedMessage.message}</p>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      isOwnMessage
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
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
                ×
              </Button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
