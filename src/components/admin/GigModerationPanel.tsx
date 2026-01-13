import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSafeQuery } from '@/hooks/useSafeQuery';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Ban,
  Flag
} from 'lucide-react';

const GigModerationPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all gigs for moderation
  const { data: gigs, isLoading, refetch } = useSafeQuery({
    queryKey: ['admin-gigs', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('gigs')
        .select(`
          *,
          employer:users!gigs_employer_id_fkey (
            id, name, email, profile_image, company_name, employer_verified, employer_badge
          ),
          campus:campuses!gigs_campus_id_fkey (name, city, state)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    timeout: 20000
  });

  // Fetch gig applications count
  const { data: applicationCounts } = useSafeQuery({
    queryKey: ['gig-application-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gig_applications')
        .select('gig_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(app => {
        counts[app.gig_id] = (counts[app.gig_id] || 0) + 1;
      });
      return counts;
    }
  });

  // Update gig status mutation
  const updateGigMutation = useMutation({
    mutationFn: async ({ gigId, status, featured }: { gigId: string; status?: string; featured?: boolean }) => {
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.is_featured = featured;

      const { error } = await supabase
        .from('gigs')
        .update(updates)
        .eq('id', gigId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Gig updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-gigs'] });
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update gig", variant: "destructive" });
    }
  });

  const handleStatusChange = (gigId: string, status: string) => {
    updateGigMutation.mutate({ gigId, status });
  };

  const handleToggleFeatured = (gigId: string, currentFeatured: boolean) => {
    updateGigMutation.mutate({ gigId, featured: !currentFeatured });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `₦${(min/100).toLocaleString()} - ₦${(max/100).toLocaleString()}`;
    if (min) return `From ₦${(min/100).toLocaleString()}`;
    return `Up to ₦${(max!/100).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Briefcase className="w-5 h-5" />
            Gig Moderation
          </CardTitle>
          <CardDescription>
            Review, approve, and manage all gigs on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search gigs by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Open Gigs</p>
              <p className="text-xl font-bold text-green-800">
                {gigs?.filter(g => g.status === 'open').length || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">In Progress</p>
              <p className="text-xl font-bold text-blue-800">
                {gigs?.filter(g => g.status === 'in_progress').length || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-600 font-medium">Featured</p>
              <p className="text-xl font-bold text-yellow-800">
                {gigs?.filter(g => g.is_featured).length || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Total Gigs</p>
              <p className="text-xl font-bold text-gray-800">{gigs?.length || 0}</p>
            </div>
          </div>

          {/* Gigs List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading gigs...</p>
            </div>
          ) : gigs && gigs.length > 0 ? (
            <div className="space-y-4">
              {gigs.map((gig) => (
                <motion.div
                  key={gig.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Gig Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground">{gig.title}</h4>
                            {gig.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                            )}
                            <Badge className={`text-xs ${getStatusBadge(gig.status)}`}>
                              {gig.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {gig.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {gig.location_type === 'remote' ? 'Remote' : 
                           gig.campus?.name || gig.city || gig.state || 'Nationwide'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatBudget(gig.budget_min, gig.budget_max)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {applicationCounts?.[gig.id] || gig.applicants_count || 0} applicants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(gig.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Employer Info */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={gig.employer?.profile_image} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {gig.employer?.name?.split(' ').map((n: string) => n[0]).join('') || 'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {gig.employer?.company_name || gig.employer?.name}
                          </p>
                        </div>
                        {gig.employer?.employer_verified && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-2 lg:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGig(gig)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant={gig.is_featured ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFeatured(gig.id, gig.is_featured)}
                        className="text-xs"
                        disabled={updateGigMutation.isPending}
                      >
                        {gig.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      {gig.status === 'open' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(gig.id, 'cancelled')}
                          className="text-xs"
                          disabled={updateGigMutation.isPending}
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {gig.status === 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(gig.id, 'open')}
                          className="text-xs bg-green-600 hover:bg-green-700"
                          disabled={updateGigMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No gigs found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gig Detail Dialog */}
      <Dialog open={!!selectedGig} onOpenChange={() => setSelectedGig(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGig?.title}</DialogTitle>
          </DialogHeader>
          {selectedGig && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusBadge(selectedGig.status)}>
                  {selectedGig.status?.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">{selectedGig.category}</Badge>
                <Badge variant="outline">{selectedGig.location_type}</Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedGig.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Budget:</span>
                  <p className="font-medium">{formatBudget(selectedGig.budget_min, selectedGig.budget_max)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">{selectedGig.duration_estimate || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Type:</span>
                  <p className="font-medium capitalize">{selectedGig.payment_type || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Posted:</span>
                  <p className="font-medium">{new Date(selectedGig.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Employer</h4>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedGig.employer?.profile_image} />
                    <AvatarFallback>{selectedGig.employer?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedGig.employer?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedGig.employer?.email}</p>
                    {selectedGig.employer?.company_name && (
                      <p className="text-sm text-muted-foreground">{selectedGig.employer?.company_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GigModerationPanel;
