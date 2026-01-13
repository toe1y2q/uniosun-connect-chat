import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSafeQuery } from '@/hooks/useSafeQuery';
import { motion } from 'framer-motion';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  User,
  DollarSign,
  Send,
  FileText
} from 'lucide-react';

const DisputeResolutionPanel = () => {
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const queryClient = useQueryClient();

  // Fetch appeals that are disputes
  const { data: disputes, isLoading, refetch } = useSafeQuery({
    queryKey: ['admin-disputes', filter],
    queryFn: async () => {
      let query = supabase
        .from('appeals')
        .select(`
          *,
          user:users!appeals_user_id_fkey (id, name, email, profile_image, role)
        `)
        .in('type', ['dispute', 'payment_issue', 'refund_request'])
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'resolved') {
        query = query.in('status', ['resolved', 'rejected']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    timeout: 15000
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, status, response }: { disputeId: string; status: string; response: string }) => {
      const { error } = await supabase
        .from('appeals')
        .update({ 
          status,
          admin_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Dispute resolved successfully" });
      setSelectedDispute(null);
      setResolution('');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    }
  });

  const handleResolve = (status: 'resolved' | 'rejected') => {
    if (!resolution.trim()) {
      toast({ 
        title: "Resolution Required", 
        description: "Please provide a resolution before submitting",
        variant: "destructive"
      });
      return;
    }
    
    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      status,
      response: resolution
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; label: string }> = {
      dispute: { bg: 'bg-orange-100 text-orange-800', label: 'Dispute' },
      payment_issue: { bg: 'bg-red-100 text-red-800', label: 'Payment Issue' },
      refund_request: { bg: 'bg-blue-100 text-blue-800', label: 'Refund Request' }
    };
    return styles[type] || { bg: 'bg-gray-100 text-gray-800', label: type };
  };

  const pendingCount = disputes?.filter(d => d.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Scale className="w-5 h-5" />
            Dispute Resolution Center
          </CardTitle>
          <CardDescription>
            Handle payment disputes, refund requests, and user conflicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('resolved')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Resolved
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>

          {/* Disputes List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading disputes...</p>
            </div>
          ) : disputes && disputes.length > 0 ? (
            <div className="space-y-4">
              {disputes.map((dispute) => {
                const typeInfo = getTypeBadge(dispute.type);
                return (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${
                      dispute.status === 'pending' ? 'border-yellow-200 bg-yellow-50/50' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={dispute.user?.profile_image} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {dispute.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{dispute.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {dispute.user?.name} • {dispute.user?.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={typeInfo.bg}>{typeInfo.label}</Badge>
                          <Badge className={getStatusBadge(dispute.status)}>
                            {dispute.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{dispute.description}</p>
                      </div>

                      {/* Admin Response (if exists) */}
                      {dispute.admin_response && (
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                          <p className="text-xs font-medium text-primary mb-1">Admin Resolution:</p>
                          <p className="text-sm">{dispute.admin_response}</p>
                        </div>
                      )}

                      {/* Meta & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(dispute.created_at).toLocaleString()}
                        </div>
                        {dispute.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <Scale className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
              <p className="text-muted-foreground">
                {filter === 'pending' ? 'No pending disputes to resolve' : 'No disputes match your filter'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Resolve Dispute
            </DialogTitle>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium mb-1">{selectedDispute.subject}</h4>
                <p className="text-sm text-muted-foreground">{selectedDispute.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Resolution / Admin Response
                </label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain the resolution decision..."
                  rows={4}
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResolve('rejected')}
                  disabled={resolveDisputeMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleResolve('resolved')}
                  disabled={resolveDisputeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Resolve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisputeResolutionPanel;
