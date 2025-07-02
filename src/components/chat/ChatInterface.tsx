import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send, ArrowLeft, AlertTriangle, Reply, Trash2, Star, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChatInterfaceProps {
  sessionId: string;
  onBack?: () => void;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

interface RepliedToMessage {
  id: string;
  message: string;
  sender: {
    name: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  session_id: string;
  created_at: string;
  is_flagged: boolean;
  flagged_reason: string | null;
  replied_to: string | null;
  sender: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  replied_to_data?: RepliedToMessage;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBack }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewFormData>({ rating: 5, comment: '' });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [preventNavigation, setPreventNavigation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Check if review already exists
  const { data: existingReview } = useQuery({
    queryKey: ['review', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('reviewer_id', user?.id!)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && profile?.role === 'aspirant'
  });

  // Timer logic for session duration
  useEffect(() => {
    if (session && session.status === 'confirmed') {
      const sessionDuration = session.duration * 60 * 1000; // Convert to milliseconds
      const startTime = new Date(session.updated_at || session.created_at).getTime();
      const endTime = startTime + sessionDuration;
      
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          setSessionExpired(true);
          setTimeRemaining(0);
          clearInterval(timer);
          
          // Auto-complete session
          completeMutation.mutate();
          
          // Force review for aspirant if not already submitted
          if (profile?.role === 'aspirant' && !existingReview && !reviewSubmitted) {
            setShowReviewForm(true);
            setPreventNavigation(true);
          }
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, profile?.role, existingReview, reviewSubmitted]);

  // Complete session mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      toast.success('Session completed');
    }
  });

  // Fetch chat messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey (id, name, profile_image)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Fetch replied-to messages separately and merge them
      const messagesWithReplies: ChatMessage[] = [];
      for (const msg of data) {
        const messageWithReply: ChatMessage = { ...msg };
        
        if (msg.replied_to) {
          const { data: repliedMsg } = await supabase
            .from('chat_messages')
            .select(`
              id,
              message,
              sender:users!chat_messages_sender_id_fkey (name)
            `)
            .eq('id', msg.replied_to)
            .single();
          
          if (repliedMsg) {
            messageWithReply.replied_to_data = repliedMsg as RepliedToMessage;
          }
        }
        
        messagesWithReplies.push(messageWithReply);
      }
      
      return messagesWithReplies;
    },
    enabled: !!sessionId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      if (!user || !newMessage.trim() || sessionExpired) return;

      // Content filtering
      const inappropriateKeywords = [
        'email', 'gmail', 'yahoo', 'hotmail', '@',
        'account number', 'bank account', 'transfer',
        'whatsapp', 'telegram', 'phone number',
        'contact me', 'reach me'
      ];

      const messageContent = newMessage.toLowerCase();
      const hasInappropriate = inappropriateKeywords.some(keyword => 
        messageContent.includes(keyword)
      );

      const uniosunKeywords = [
        'uniosun', 'university', 'study', 'course', 'department',
        'exam', 'assignment', 'lecture', 'tutorial', 'academic',
        'student', 'learning', 'education', 'subject', 'topic'
      ];

      const hasUniosunContent = uniosunKeywords.some(keyword => 
        messageContent.includes(keyword)
      );

      let isFlagged = false;
      let flaggedReason = '';

      if (hasInappropriate) {
        isFlagged = true;
        flaggedReason = 'Contains inappropriate content (contact information or financial details)';
      } else if (!hasUniosunContent && messageContent.length > 10) {
        isFlagged = true;
        flaggedReason = 'Message does not appear to be related to UNIOSUN academic activities';
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          message: newMessage,
          replied_to: replyToMessage,
          is_flagged: isFlagged,
          flagged_reason: isFlagged ? flaggedReason : null
        })
        .select()
        .single();

      if (error) throw error;

      if (isFlagged) {
        await supabase.from('reports').insert({
          message_id: data.id,
          flagged_by: user.id,
          reason: flaggedReason,
          status: 'pending'
        });

        toast.warning('Your message has been flagged for review. Please keep conversations academic and UNIOSUN-related.');
      }

      return data;
    },
    onSuccess: () => {
      setMessage('');
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      toast.success('Message deleted');
    }
  });

  // Submit review mutation with immediate payment release
  const submitReviewMutation = useMutation({
    mutationFn: async (review: ReviewFormData) => {
      const { error } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId,
          reviewer_id: user?.id!,
          rating: review.rating,
          comment: review.comment
        });
      
      if (error) throw error;

      // Immediately add payment to student's wallet upon review submission
      if (session?.student_id && session?.amount) {
        const { error: walletError } = await supabase
          .from('wallets')
          .upsert({
            user_id: session.student_id,
            balance: session.amount
          }, {
            onConflict: 'user_id'
          });

        if (walletError) {
          // If upsert fails, try to update existing wallet
          const { error: updateError } = await supabase.rpc('increment_wallet_balance', {
            user_id: session.student_id,
            amount: session.amount
          });

          if (updateError) {
            console.error('Error updating wallet:', updateError);
          }
        }

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            user_id: session.student_id,
            type: 'earning',
            amount: session.amount,
            session_id: sessionId,
            status: 'completed',
            description: `Payment for tutoring session`
          });
      }
    },
    onSuccess: () => {
      toast.success('Review submitted successfully! Payment has been released to the student.');
      setReviewSubmitted(true);
      setShowReviewForm(false);
      setPreventNavigation(false);
      queryClient.invalidateQueries({ queryKey: ['review', sessionId] });
      
      // Small delay before navigation to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() || sessionExpired) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Copy and paste is not allowed in chat');
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Block navigation if review is required but not submitted
  const handleBackNavigation = () => {
    if (preventNavigation || (sessionExpired && profile?.role === 'aspirant' && !existingReview && !reviewSubmitted)) {
      toast.error('Please submit your review before leaving. This is required to release payment to the student.');
      setShowReviewForm(true);
      setPreventNavigation(true);
      return;
    }
    
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  // Check on component mount if session is already completed and requires review
  useEffect(() => {
    if (session && session.status === 'completed' && profile?.role === 'aspirant' && !existingReview && !reviewSubmitted) {
      setShowReviewForm(true);
      setPreventNavigation(true);
    }
  }, [session, profile?.role, existingReview, reviewSubmitted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  const otherUser = session.client?.id === user?.id ? session.student : session.client;

  // Mandatory review form modal for aspirants - Show as overlay to prevent navigation
  if (showReviewForm && profile?.role === 'aspirant') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Review Required</CardTitle>
            <p className="text-sm text-center text-gray-600 mt-2">
              You must submit a review to release payment to the student. This is mandatory and required before leaving.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className={`p-1 ${reviewData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience with this tutoring session..."
                rows={3}
              />
            </div>

            <Button 
              onClick={() => submitReviewMutation.mutate(reviewData)}
              disabled={submitReviewMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review & Release Payment'}
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              Payment will be released to the student immediately after you submit this review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-screen-sm sm:max-w-4xl mx-auto">
      {/* Header */}
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackNavigation}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.profile_image} />
              <AvatarFallback>
                {otherUser?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <CardTitle className="text-lg">{otherUser?.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="text-xs">
                  {session.duration} mins
                </Badge>
                <span>₦{session.amount.toLocaleString()}</span>
                {timeRemaining > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            </div>

            <Badge className={
              session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {sessionExpired ? 'Expired' : session.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* ... keep existing code (loading state, empty state, and message rendering) */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
            <p className="text-gray-600 text-sm px-4">
              Begin your tutoring session! Keep the conversation academic and related to UNIOSUN studies.
            </p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const isFlagged = msg.is_flagged;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div className={`max-w-xs sm:max-w-sm ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={msg.sender?.profile_image} />
                        <AvatarFallback className="text-xs">
                          {msg.sender?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{msg.sender?.name}</span>
                    </div>
                  )}

                  {msg.replied_to_data && (
                    <div className="text-xs text-gray-500 mb-1 p-2 bg-gray-100 rounded border-l-2 border-gray-300">
                      <div className="font-medium">{msg.replied_to_data.sender?.name}</div>
                      <div className="truncate">{msg.replied_to_data.message}</div>
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200'
                    } ${isFlagged ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <p className={`text-sm ${isFlagged && !isOwn ? 'text-red-700' : ''}`}>
                      {msg.message}
                    </p>
                    
                    {isFlagged && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Flagged for review</span>
                      </div>
                    )}

                    {!sessionExpired && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setReplyToMessage(msg.id)}
                          className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => deleteMessageMutation.mutate(msg.id)}
                            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at!).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session.status === 'confirmed' && !sessionExpired && (
        <Card className="rounded-none border-0 border-t">
          <CardContent className="p-4">
            {replyToMessage && (
              <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Replying to message</span>
                  <button 
                    onClick={() => setReplyToMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onCopy={handleCopyPaste}
                onPaste={handleCopyPaste}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                maxLength={500}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 px-1">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Keep conversations academic and UNIOSUN-related. Copy/paste disabled.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sessionExpired && profile?.role === 'aspirant' && !existingReview && !reviewSubmitted && (
        <Card className="rounded-none border-0 border-t bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-red-800 font-medium mb-2">Session ended - Review required to release payment</p>
            <Button 
              onClick={() => {
                setShowReviewForm(true);
                setPreventNavigation(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Submit Mandatory Review
            </Button>
          </CardContent>
        </Card>
      )}

      {sessionExpired && (existingReview || reviewSubmitted) && (
        <Card className="rounded-none border-0 border-t bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-green-800 font-medium">Session completed and review submitted</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChatInterface;
