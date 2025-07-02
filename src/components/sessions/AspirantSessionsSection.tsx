import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MessageSquare, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AspirantSessionsSection = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['aspirant-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:users!sessions_student_id_fkey (id, name, email, profile_image, departments!users_department_id_fkey (name))
        `)
        .eq('client_id', profile.id)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-16 sm:h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-12 text-center">
          <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">No sessions yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Book your first session with a verified student
          </p>
          <Button 
            onClick={() => navigate('/talents')}
            className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
            size="sm"
          >
            Find a Tutor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">My Sessions</h2>
        <Badge variant="outline" className="text-xs sm:text-sm">
          {sessions.length} total
        </Badge>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={session.student?.profile_image} />
                    <AvatarFallback>
                      {session.student?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg truncate">
                      {session.student?.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {session.student?.departments?.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">
                          {new Date(session.scheduled_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>
                          {new Date(session.scheduled_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} ({session.duration} mins)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                  <div className="flex flex-col sm:items-end">
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
                    
                    <div className="text-base sm:text-lg font-semibold text-green-600">
                      ₦{(session.amount / 100).toLocaleString()}
                    </div>
                  </div>

                  {session.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                      onClick={() => navigate(`/chat/${session.id}`)}
                    >
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Chat
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

export default AspirantSessionsSection;