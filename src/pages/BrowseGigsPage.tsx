import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import GigCard from "@/components/gigs/GigCard";
import GigFilters, { GigFilters as FiltersType } from "@/components/gigs/GigFilters";
import GigApplicationModal from "@/components/gigs/GigApplicationModal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ArrowLeft, Briefcase, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  location_type: string;
  city: string | null;
  state: string | null;
  budget_min: number | null;
  budget_max: number | null;
  payment_type: string | null;
  duration_estimate: string | null;
  is_featured: boolean;
  applicants_count: number;
  created_at: string;
  employer: {
    name: string;
    employer_verified: boolean;
    company_name: string | null;
  } | null;
}

const BrowseGigsPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    category: 'all',
    location_type: 'all',
    payment_type: 'all',
    budget_min: '',
    budget_max: '',
  });

  useEffect(() => {
    fetchGigs();
  }, [filters]);

  const fetchGigs = async () => {
    try {
      let query = supabase
        .from('gigs')
        .select(`
          *,
          employer:users!gigs_employer_id_fkey(name, employer_verified, company_name)
        `)
        .eq('status', 'open')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.location_type && filters.location_type !== 'all') {
        query = query.eq('location_type', filters.location_type);
      }
      if (filters.payment_type && filters.payment_type !== 'all') {
        query = query.eq('payment_type', filters.payment_type);
      }
      if (filters.budget_min) {
        query = query.gte('budget_max', parseInt(filters.budget_min));
      }
      if (filters.budget_max) {
        query = query.lte('budget_min', parseInt(filters.budget_max));
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGigs(data || []);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      toast({
        title: "Error",
        description: "Failed to load gigs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (gig: Gig) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to apply for gigs",
        variant: "destructive"
      });
      return;
    }

    if (profile?.role !== 'student') {
      toast({
        title: "Students Only",
        description: "Only students can apply for gigs",
        variant: "destructive"
      });
      return;
    }

    setSelectedGig(gig);
    setShowApplicationModal(true);
  };

  const featuredGigs = gigs.filter(g => g.is_featured);
  const regularGigs = gigs.filter(g => !g.is_featured);

  return (
    <div className="min-h-screen bg-background">
      {user && <Navigation />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              {!user && (
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Browse Gigs
              </h1>
            </div>
            <p className="text-muted-foreground">
              Find opportunities that match your skills and schedule
            </p>
          </div>
          <Badge variant="secondary" className="hidden md:flex">
            <Briefcase className="w-4 h-4 mr-2" />
            {gigs.length} gigs available
          </Badge>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <GigFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Loading gigs..." />
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No gigs found</h2>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or check back later
            </p>
            <Button onClick={() => setFilters({
              search: '',
              category: 'all',
              location_type: 'all',
              payment_type: 'all',
              budget_min: '',
              budget_max: '',
            })}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Featured Gigs */}
            {featuredGigs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-foreground">Featured Gigs</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredGigs.map((gig) => (
                    <GigCard
                      key={gig.id}
                      gig={gig}
                      onApply={() => handleApply(gig)}
                      showApplyButton={profile?.role === 'student'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Gigs */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                All Gigs
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularGigs.map((gig) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    onApply={() => handleApply(gig)}
                    showApplyButton={profile?.role === 'student'}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application Modal */}
      {selectedGig && (
        <GigApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedGig(null);
          }}
          gig={selectedGig}
          onSuccess={fetchGigs}
        />
      )}
    </div>
  );
};

export default BrowseGigsPage;
