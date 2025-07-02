
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MessageSquare, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SessionsSection = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['student-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          users!sessions_client_id_fkey (name, email, profile_image)
        `)
        .eq('student_id', profile.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const handleAcceptSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Refetch sessions
      // queryClient.invalidateQueries(['student-sessions']);
    } catch (error) {
      console.error('Error accepting session:', error);
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Refetch sessions
      // queryClient.invalidateQueries(['student-sessions']);
    } catch (error) {
      console.error('Error declining session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
          <p className="text-gray-600">
            Session requests from aspirants will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Sessions</h2>
        <Badge variant="outline">{sessions.length} total</Badge>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session.users?.profile_image} />
                    <AvatarFallback>
                      {session.users?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{session.users?.name}</h3>
                    <p className="text-gray-600">{session.users?.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(session.scheduled_at).toLocaleTimeString()} 
                        ({session.duration} mins)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge 
                    className={
                      session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {session.status}
                  </Badge>
                  
                  <div className="mt-2 text-lg font-semibold">
                    ₦{(session.amount / 100).toLocaleString()}
                  </div>

                  {session.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => handleAcceptSession(session.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineSession(session.id)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {session.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate(`/chat/${session.id}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Join Chat
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SessionsSection;
