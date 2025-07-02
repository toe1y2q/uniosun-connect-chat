
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Send, ArrowLeft, Star, Flag } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface ChatInterfaceProps {
  sessionId: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender?: {
    name: string;
  };
}

interface SessionData {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client_id: string;
  student_id: string;
  amount: number;
  client?: { name: string };
  student?: { name: string };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBack }) => {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch session data
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<SessionData> => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          client_id,
          student_id,
          amount,
          client:users!sessions_client_id_fkey(name),
          student:users!sessions_student_id_fkey(name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          sender_id,
          created_at,
          sender:users!chat_messages_sender_id_fkey(name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message: messageText,
          sender_id: user?.id!,
          session_id: sessionId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      setMessage('');
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      setShowReview(true);
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;

      // Create review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId,
          reviewer_id: user?.id!,
          rating,
          comment: reviewComment
        });

      if (reviewError) throw reviewError;

      // Release payment to student immediately after review
      const studentId = session.student_id;
      const amount = session.amount;

      // Update student's wallet balance
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          wallet_balance: supabase.raw(`COALESCE(wallet_balance, 0) + ${amount}`)
        })
        .eq('id', studentId);

      if (walletError) {
        // Fallback: get current balance and add amount
        const { data: student } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', studentId)
          .single();

        const currentBalance = student?.wallet_balance || 0;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_balance: currentBalance + amount })
          .eq('id', studentId);

        if (updateError) throw updateError;
      }

      // Create earning transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: studentId,
          type: 'earning',
          amount,
          status: 'completed',
          description: 'Session payment received',
          session_id: sessionId
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      toast.success('Review submitted and payment released!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onBack();
    },
    onError: () => {
      toast.error('Failed to submit review');
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleCompleteSession = () => {
    completeSessionMutation.mutate();
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReviewMutation.mutate();
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canCompleteSession = session?.client_id === user?.id && session?.status === 'confirmed';

  if (showReview) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h3 className="text-lg font-semibold">Rate Your Session</h3>
          <p className="text-gray-600">How was your tutoring session with {session?.student?.name}?</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="flex-1"
            >
              {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review & Release Payment'}
            </Button>
            <Button variant="outline" onClick={onBack}>
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-semibold">
              Chat with {profile?.role === 'student' ? session?.client?.name : session?.student?.name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">Status: {session?.status}</p>
          </div>
        </div>
        
        {canCompleteSession && (
          <Button 
            onClick={handleCompleteSession}
            disabled={completeSessionMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Session
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender_id === user?.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${
                msg.sender_id === user?.id ? 'text-green-100' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {session?.status === 'confirmed' && (
        <form onSubmit={handleSendMessage} className="border-t bg-white p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatInterface;
