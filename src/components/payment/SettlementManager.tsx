import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  description: string;
  scheduled_at: string;
  flutterwave_reference: string | null;
  users: {
    name: string;
    email: string;
  } | null;
}

const SettlementManager = () => {
  const queryClient = useQueryClient();

  // Fetch sessions that are ready for settlement
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['settlement-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          amount,
          status,
          payment_status,
          description,
          scheduled_at,
          flutterwave_reference,
          users!sessions_student_id_fkey (
            name,
            email
          )
        `)
        .eq('payment_status', 'completed')
        .eq('status', 'completed')
        .not('flutterwave_reference', 'is', null)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as Session[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Settlement mutation
  const settleMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('settle-escrow', {
        body: { sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, sessionId) => {
      toast.success(`Settlement processed successfully! Student payout: ₦${data.studentPayout}`);
      queryClient.invalidateQueries({ queryKey: ['settlement-sessions'] });
    },
    onError: (error) => {
      toast.error(`Settlement failed: ${error.message}`);
    }
  });

  const handleSettle = (sessionId: string) => {
    settleMutation.mutate(sessionId);
  };

  const formatAmount = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(kobo / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Payment Settlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading settlements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5" />
          Payment Settlements
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manually trigger settlements for completed sessions
        </p>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No sessions ready for settlement</p>
            <p className="text-sm">All payments have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{session.description}</h4>
                      <Badge variant="secondary">
                        {formatAmount(session.amount)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Student: {session.users?.name} ({session.users?.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Session: {formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true })}
                    </p>
                    {session.flutterwave_reference && (
                      <p className="text-xs font-mono text-muted-foreground">
                        Ref: {session.flutterwave_reference}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    
                    <Button
                      onClick={() => handleSettle(session.id)}
                      disabled={settleMutation.isPending}
                      size="sm"
                      className="min-w-[100px]"
                    >
                      {settleMutation.isPending ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Settling...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Settle
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Session Amount:</span>
                    <span className="font-medium">{formatAmount(session.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student Share (70%):</span>
                    <span className="font-medium text-green-600">
                      {formatAmount(Math.floor(session.amount * 0.7))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Share (30%):</span>
                    <span className="font-medium text-blue-600">
                      {formatAmount(Math.floor(session.amount * 0.3))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SettlementManager;