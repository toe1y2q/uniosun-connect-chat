import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Star, MessageCircle, Phone, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ChatInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch session details
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
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
    },
  });

  // Determine the chat partner
  const chatPartner = profile?.role === 'aspirant' ? session?.student : session?.client;

  // Fetch chat messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Mutation to send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!sessionId || !user?.id) throw new Error('Missing session or user ID');
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content: messageText,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['chat-messages', sessionId]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  // Mutation to update session status
  const updateSessionMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Session ended!');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    },
  });

  // Fixed review submission mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!sessionId || !user?.id) throw new Error('Missing required data');

      // Submit review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId,
          reviewer_id: user.id,
          rating,
          comment
        });

      if (reviewError) throw reviewError;

      // Update session status to completed
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Get session details for payment processing
      const { data: sessionData, error: fetchError } = await supabase
        .from('sessions')
        .select('amount, student_id')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Create earning transaction for the student
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: sessionData.student_id,
          type: 'earning',
          amount: sessionData.amount,
          status: 'completed',
          session_id: sessionId,
          description: 'Session payment received'
        });

      if (transactionError) throw transactionError;

      // Update student's wallet balance directly
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          wallet_balance: supabase.sql`COALESCE(wallet_balance, 0) + ${sessionData.amount}` 
        })
        .eq('id', sessionData.student_id);

      if (walletError) throw walletError;
    },
    onSuccess: () => {
      toast.success('Review submitted and payment processed!');
      setShowReviewModal(false);
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review');
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          queryClient.invalidateQueries(['chat-messages', sessionId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const handleEndSession = () => {
    if (profile?.role === 'aspirant') {
      setShowReviewModal(true);
    } else {
      // Students can end session without review
      updateSessionMutation.mutate({ status: 'completed' });
    }
  };

  const handleReviewSubmit = () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    submitReviewMutation.mutate({ rating, comment: reviewComment });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            {chatPartner && (
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={chatPartner?.profile_image} alt={chatPartner?.name} />
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {chatPartner?.name?.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{chatPartner?.name}</span>
              </div>
            )}
            <Button variant="destructive" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {isSessionLoading || isMessagesLoading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          <Card className="shadow-none border-0 bg-transparent">
            <CardContent className="p-0 space-y-4">
              {messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`rounded-xl px-4 py-2 max-w-md ${
                        msg.sender_id === user?.id ? 'bg-green-100 text-gray-900' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>
        )}

        {/* Message Input */}
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
            Send
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Session</DialogTitle>
            <DialogDescription>
              Please rate your tutoring session before ending it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleReviewSubmit}
                disabled={rating === 0 || submitReviewMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
