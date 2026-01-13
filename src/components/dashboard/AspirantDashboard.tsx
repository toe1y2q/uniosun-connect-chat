import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAutoScrollTabs } from '@/hooks/use-auto-scroll-tabs';
import { useSafeQuery } from '@/hooks/useSafeQuery';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import { 
  Briefcase, 
  Star, 
  Wallet, 
  DollarSign,
  Clock,
  CheckCircle,
  User,
  Settings,
  Search,
  FileText,
  TrendingUp
} from 'lucide-react';
import AspirantWallet from '@/components/wallet/AspirantWallet';  
import ProfileSettings from '@/components/profile/ProfileSettings';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AppealsForm from '@/components/appeals/AppealsForm';
import AppealsList from '@/components/appeals/AppealsList';
import { Link } from 'react-router-dom';

const AspirantDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const { tabsRef, registerTab } = useAutoScrollTabs(activeTab);

  // Fetch available gigs
  const { data: featuredGigs, isLoading: gigsLoading, error: gigsError, refetch } = useSafeQuery({
    queryKey: ['featured-gigs-aspirant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          employer:users!gigs_employer_id_fkey (name, company_name, employer_verified)
        `)
        .eq('status', 'open')
        .eq('is_featured', true)
        .limit(6);

      if (error) throw error;
      return data;
    },
    timeout: 15000
  });

  // Fetch user's gig applications
  const { data: myApplications, isLoading: applicationsLoading } = useSafeQuery({
    queryKey: ['my-applications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('gig_applications')
        .select(`
          *,
          gig:gigs!gig_applications_gig_id_fkey (
            id, title, budget_min, budget_max, status,
            employer:users!gigs_employer_id_fkey (name, company_name)
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch user's transactions
  const { data: transactions } = useSafeQuery({
    queryKey: ['user-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const totalSpent = transactions?.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0;
  const pendingApplications = myApplications?.filter(a => a.status === 'pending').length || 0;
  const acceptedApplications = myApplications?.filter(a => a.status === 'accepted').length || 0;

  const isLoading = gigsLoading || applicationsLoading;
  const hasError = gigsError;

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Negotiable';
    if (min && max) return `₦${(min/100).toLocaleString()} - ₦${(max/100).toLocaleString()}`;
    if (min) return `From ₦${(min/100).toLocaleString()}`;
    return `Up to ₦${(max!/100).toLocaleString()}`;
  };

  if (!profile) return null;

  return (
    <DashboardErrorBoundary loading={isLoading} error={hasError} onRetry={refetch}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <AvatarUpload size="sm" showUploadButton={false} />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                    Welcome back, {profile?.name}!
                  </h1>
                  <p className="text-xs sm:text-base text-muted-foreground truncate">Find gigs and start earning</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary text-xs px-2 py-1 self-start">
                <Briefcase className="w-3 h-3 mr-1" />
                Student
              </Badge>
            </div>

            {/* Quick Action Card */}
            <Card className="mb-3 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 rounded-full bg-primary text-primary-foreground">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary text-sm">Ready to Earn?</h3>
                      <p className="text-muted-foreground text-xs">Browse available gigs and start making money today.</p>
                    </div>
                  </div>
                  <Link to="/gigs">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-2 w-full sm:w-auto">
                      Browse Gigs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="w-full relative">
              <div ref={tabsRef} className="overflow-x-auto scrollbar-hide">
                <TabsList className="flex w-max min-w-full bg-primary/10 h-auto p-1 gap-1">
                  <TabsTrigger value="overview" ref={(el) => registerTab('overview', el)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="applications" ref={(el) => registerTab('applications', el)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap">
                    My Applications
                  </TabsTrigger>
                  <TabsTrigger value="wallet" ref={(el) => registerTab('wallet', el)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap">
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="appeals" ref={(el) => registerTab('appeals', el)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap">
                    Appeals
                  </TabsTrigger>
                  <TabsTrigger value="profile" ref={(el) => registerTab('profile', el)} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap">
                    Profile
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                    <CardTitle className="text-xs font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-3 w-3 text-primary" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-lg font-bold text-primary">₦{((profile?.wallet_balance || 0) / 100).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Available balance</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                    <CardTitle className="text-xs font-medium">Pending Applications</CardTitle>
                    <Clock className="h-3 w-3 text-primary" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-lg font-bold text-primary">{pendingApplications}</div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                    <CardTitle className="text-xs font-medium">Accepted Gigs</CardTitle>
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-lg font-bold text-primary">{acceptedApplications}</div>
                    <p className="text-xs text-muted-foreground">Active work</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                    <CardTitle className="text-xs font-medium">Total Applications</CardTitle>
                    <FileText className="h-3 w-3 text-primary" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-lg font-bold text-primary">{myApplications?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Featured Gigs */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Star className="w-5 h-5" />
                    Featured Gigs
                  </CardTitle>
                  <CardDescription>Hot opportunities for you</CardDescription>
                </CardHeader>
                <CardContent>
                  {featuredGigs && featuredGigs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {featuredGigs.map((gig: any) => (
                        <Link key={gig.id} to={`/gig/${gig.id}`}>
                          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-1 line-clamp-1">{gig.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {gig.employer?.company_name || gig.employer?.name}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-primary font-medium">
                                  {formatBudget(gig.budget_min, gig.budget_max)}
                                </span>
                                <Badge variant="outline" className="text-xs">{gig.location_type}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No featured gigs available</p>
                      <Link to="/gigs">
                        <Button variant="outline" className="mt-4">Browse All Gigs</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    My Applications
                  </CardTitle>
                  <CardDescription>Track your gig applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {myApplications && myApplications.length > 0 ? (
                    <div className="space-y-3">
                      {myApplications.map((app: any) => (
                        <div key={app.id} className="flex flex-col gap-2 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm truncate">{app.gig?.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {app.gig?.employer?.company_name || app.gig?.employer?.name}
                              </p>
                            </div>
                            <Badge className={
                              app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {app.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                            {app.proposed_amount && (
                              <span className="font-medium text-primary">₦{(app.proposed_amount/100).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base font-semibold mb-2">No applications yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">Start applying to gigs to earn money</p>
                      <Link to="/gigs"><Button>Browse Gigs</Button></Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet"><AspirantWallet /></TabsContent>
            <TabsContent value="appeals" className="space-y-6"><AppealsForm /><AppealsList /></TabsContent>
            <TabsContent value="profile"><ProfileSettings /></TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default AspirantDashboard;
