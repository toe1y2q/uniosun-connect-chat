
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AppealsList = () => {
  const { profile } = useAuth();

  const { data: appeals, isLoading } = useQuery({
    queryKey: ['user-appeals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-green-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageSquare className="w-5 h-5" />
          Your Appeals
        </CardTitle>
        <CardDescription>
          Track the status of your submitted appeals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appeals && appeals.length > 0 ? (
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <motion.div
                key={appeal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(appeal.status)}
                    <h4 className="font-semibold text-gray-900">{appeal.subject}</h4>
                  </div>
                  <Badge className={getStatusColor(appeal.status)}>
                    {appeal.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{appeal.description}</p>
                
                {appeal.admin_response && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400 mb-3">
                    <h5 className="font-semibold text-blue-800 mb-1">Admin Response:</h5>
                    <p className="text-sm text-blue-700">{appeal.admin_response}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Type: {appeal.type}</span>
                  <span>Submitted: {new Date(appeal.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appeals Yet</h3>
            <p className="text-gray-600">You haven't submitted any appeals. Use the form above if you need help.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppealsList;
