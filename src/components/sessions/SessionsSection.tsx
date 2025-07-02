
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
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-6">
                <div className="h-16 sm:h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Session requests from aspirants will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">Your Sessions</h2>
          <Badge variant="outline" className="w-fit">{sessions.length} total</Badge>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow w-full">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col space-y-4">
                  {/* User Info Row */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage src={session.users?.profile_image} />
                      <AvatarFallback>
                        {session.users?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-lg truncate">{session.users?.name}</h3>
                      <p className="text-xs sm:text-base text-gray-600 truncate">{session.users?.email}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <Badge 
                        className={`text-xs mb-2 ${
                          session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {session.status}
                      </Badge>
                      
                      <div className="text-sm sm:text-lg font-semibold">
                        ₦{(session.amount / 100).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Session Details Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{new Date(session.scheduled_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(session.scheduled_at).toLocaleTimeString()} 
                          ({session.duration} mins)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {session.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleAcceptSession(session.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleDeclineSession(session.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}

                      {session.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/chat/${session.id}`)}
                          className="text-xs sm:text-sm"
                        >
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Join Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionsSection;
