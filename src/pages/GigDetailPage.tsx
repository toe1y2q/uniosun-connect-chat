import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/Navigation';
import GigApplicationModal from '@/components/gigs/GigApplicationModal';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/AuthContext';
import { useSafeQuery } from '@/hooks/useSafeQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  Building2,
  CheckCircle,
  Star,
  ArrowLeft,
  Users,
  Calendar,
  Award,
  Share2,
  Heart,
  AlertCircle
} from 'lucide-react';

const GigDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Fetch gig details
  const { data: gig, isLoading, error } = useSafeQuery({
    queryKey: ['gig-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Gig ID required');
      
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          employer:users!gigs_employer_id_fkey (
            id, name, email, profile_image, company_name, 
            employer_verified, employer_badge, created_at
          ),
          campus:campuses!gigs_campus_id_fkey (name, city, state, type)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    timeout: 15000,
    enabled: !!id
  });

  // Fetch similar gigs
  const { data: similarGigs } = useSafeQuery({
    queryKey: ['similar-gigs', gig?.category],
    queryFn: async () => {
      if (!gig) return [];
      
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          id, title, budget_min, budget_max, location_type, created_at,
          employer:users!gigs_employer_id_fkey (name, company_name)
        `)
        .eq('category', gig.category)
        .eq('status', 'open')
        .neq('id', gig.id)
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!gig?.category
  });

  // Check if user has already applied
  const { data: existingApplication } = useSafeQuery({
    queryKey: ['gig-application-check', id, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !id) return null;
      
      const { data, error } = await supabase
        .from('gig_applications')
        .select('id, status')
        .eq('gig_id', id)
        .eq('student_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && !!id
  });

  // Fetch employer stats
  const { data: employerStats } = useSafeQuery({
    queryKey: ['employer-stats', gig?.employer?.id],
    queryFn: async () => {
      if (!gig?.employer?.id) return null;
      
      const { data: gigData } = await supabase
        .from('gigs')
        .select('id')
        .eq('employer_id', gig.employer.id);

      return {
        totalGigs: gigData?.length || 0,
        memberSince: new Date(gig.employer.created_at).getFullYear()
      };
    },
    enabled: !!gig?.employer?.id
  });

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Negotiable';
    if (min && max) return `₦${(min/100).toLocaleString()} - ₦${(max/100).toLocaleString()}`;
    if (min) return `From ₦${(min/100).toLocaleString()}`;
    return `Up to ₦${(max!/100).toLocaleString()}`;
  };

  const getLocationDisplay = () => {
    if (!gig) return '';
    if (gig.location_type === 'remote') return 'Remote Work';
    if (gig.campus) return `${gig.campus.name}, ${gig.campus.city}`;
    if (gig.city && gig.state) return `${gig.city}, ${gig.state}`;
    if (gig.state) return gig.state;
    return 'Nationwide';
  };

  const canApply = profile?.role === 'student' && gig?.status === 'open' && !existingApplication;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="Loading gig details..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Gig Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This gig may have been removed or doesn't exist.
          </p>
          <Button onClick={() => navigate('/gigs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Gigs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/gigs')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gigs
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{gig.category}</Badge>
                    <Badge variant="outline">{gig.location_type}</Badge>
                    {gig.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge className={
                      gig.status === 'open' ? 'bg-green-100 text-green-800' :
                      gig.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {gig.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-2xl lg:text-3xl">{gig.title}</CardTitle>
                  
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {getLocationDisplay()}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatBudget(gig.budget_min, gig.budget_max)}
                    </span>
                    {gig.duration_estimate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {gig.duration_estimate}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {gig.applicants_count || 0} applicants
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {gig.description}
                    </p>
                  </div>

                  {gig.skills_required && Array.isArray(gig.skills_required) && gig.skills_required.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {gig.skills_required.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Payment Type</span>
                      <p className="font-medium capitalize">{gig.payment_type || 'To be discussed'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Posted</span>
                      <p className="font-medium">{new Date(gig.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Similar Gigs */}
            {similarGigs && similarGigs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Gigs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {similarGigs.map((similar: any) => (
                      <Link
                        key={similar.id}
                        to={`/gig/${similar.id}`}
                        className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <h4 className="font-medium mb-1 line-clamp-1">{similar.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {similar.employer?.company_name || similar.employer?.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBudget(similar.budget_min, similar.budget_max)}</span>
                          <span>•</span>
                          <span>{similar.location_type}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-2xl font-bold text-primary mb-1">
                      {formatBudget(gig.budget_min, gig.budget_max)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {gig.payment_type === 'hourly' ? 'per hour' : 'fixed price'}
                    </p>
                  </div>

                  {!user ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate('/auth')}
                    >
                      Login to Apply
                    </Button>
                  ) : existingApplication ? (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium">You've already applied</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        Status: {existingApplication.status}
                      </p>
                    </div>
                  ) : canApply ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowApplicationModal(true)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  ) : gig.status !== 'open' ? (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">This gig is no longer accepting applications</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Only students can apply for gigs</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Heart className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Employer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={gig.employer?.profile_image} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {gig.employer?.name?.split(' ').map((n: string) => n[0]).join('') || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {gig.employer?.company_name || gig.employer?.name}
                        </h4>
                        {gig.employer?.employer_verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      {gig.employer?.company_name && (
                        <p className="text-sm text-muted-foreground">{gig.employer?.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {gig.employer?.employer_badge && (
                      <div className="flex items-center gap-2 text-yellow-700">
                        <Award className="w-4 h-4" />
                        <span>Premium Employer</span>
                      </div>
                    )}
                    {employerStats && (
                      <>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          <span>{employerStats.totalGigs} gigs posted</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Member since {employerStats.memberSince}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Application Modal */}
      {gig && (
        <GigApplicationModal
          gig={gig}
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
        />
      )}
    </div>
  );
};

export default GigDetailPage;
