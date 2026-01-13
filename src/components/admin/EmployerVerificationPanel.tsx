import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSafeQuery } from '@/hooks/useSafeQuery';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  Shield,
  Mail,
  Calendar,
  Briefcase,
  Award
} from 'lucide-react';

const EmployerVerificationPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const queryClient = useQueryClient();

  // Fetch employers
  const { data: employers, isLoading, refetch } = useSafeQuery({
    queryKey: ['admin-employers', searchTerm, filter],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'employer')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
      }

      if (filter === 'verified') {
        query = query.eq('employer_verified', true);
      } else if (filter === 'pending') {
        query = query.eq('employer_verified', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    timeout: 15000
  });

  // Fetch gig counts per employer
  const { data: gigCounts } = useSafeQuery({
    queryKey: ['employer-gig-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gigs')
        .select('employer_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(gig => {
        counts[gig.employer_id] = (counts[gig.employer_id] || 0) + 1;
      });
      return counts;
    }
  });

  // Verify employer mutation
  const verifyEmployerMutation = useMutation({
    mutationFn: async ({ employerId, verified, badge }: { employerId: string; verified: boolean; badge?: boolean }) => {
      const updates: any = { employer_verified: verified };
      if (badge !== undefined) updates.employer_badge = badge;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', employerId);

      if (error) throw error;
    },
    onSuccess: (_, { verified }) => {
      toast({ 
        title: verified ? "Employer Verified" : "Verification Revoked",
        description: verified 
          ? "The employer has been verified successfully" 
          : "Employer verification has been revoked"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-employers'] });
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employer", variant: "destructive" });
    }
  });

  // Toggle badge mutation
  const toggleBadgeMutation = useMutation({
    mutationFn: async ({ employerId, hasBadge }: { employerId: string; hasBadge: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ employer_badge: !hasBadge })
        .eq('id', employerId);

      if (error) throw error;
    },
    onSuccess: (_, { hasBadge }) => {
      toast({ 
        title: hasBadge ? "Badge Removed" : "Badge Awarded",
        description: hasBadge ? "Employer badge has been removed" : "Premium employer badge awarded"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-employers'] });
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update badge", variant: "destructive" });
    }
  });

  const handleVerify = (employerId: string, verified: boolean) => {
    verifyEmployerMutation.mutate({ employerId, verified });
  };

  const handleToggleBadge = (employerId: string, hasBadge: boolean) => {
    toggleBadgeMutation.mutate({ employerId, hasBadge });
  };

  const pendingCount = employers?.filter(e => !e.employer_verified).length || 0;
  const verifiedCount = employers?.filter(e => e.employer_verified).length || 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Building2 className="w-5 h-5" />
            Employer Verification
          </CardTitle>
          <CardDescription>
            Verify employer accounts and manage premium badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({employers?.length || 0})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? '' : 'border-yellow-200 text-yellow-700'}
              >
                Pending ({pendingCount})
              </Button>
              <Button
                variant={filter === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('verified')}
                className={filter === 'verified' ? '' : 'border-green-200 text-green-700'}
              >
                Verified ({verifiedCount})
              </Button>
            </div>
          </div>

          {/* Employers List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading employers...</p>
            </div>
          ) : employers && employers.length > 0 ? (
            <div className="space-y-4">
              {employers.map((employer) => (
                <motion.div
                  key={employer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 transition-colors ${
                    !employer.employer_verified ? 'border-yellow-200 bg-yellow-50/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Employer Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 border-2 border-muted">
                        <AvatarImage src={employer.profile_image} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {employer.name?.split(' ').map((n: string) => n[0]).join('') || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{employer.name}</h4>
                          {employer.employer_verified && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {employer.employer_badge && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{employer.email}</span>
                        </div>
                        {employer.company_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Building2 className="w-3 h-3" />
                            <span>{employer.company_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {gigCounts?.[employer.id] || 0} gigs posted
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(employer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:w-auto">
                      {!employer.employer_verified ? (
                        <Button
                          size="sm"
                          onClick={() => handleVerify(employer.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                          disabled={verifyEmployerMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verify
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(employer.id, false)}
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                          disabled={verifyEmployerMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant={employer.employer_badge ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleBadge(employer.id, employer.employer_badge)}
                        className={`text-xs ${employer.employer_badge ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                        disabled={toggleBadgeMutation.isPending}
                      >
                        <Award className="w-3 h-3 mr-1" />
                        {employer.employer_badge ? 'Remove Badge' : 'Award Badge'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employers found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerVerificationPanel;
