import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Users,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  ArrowRight
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface Gig {
  id: string;
  title: string;
  status: string;
  applicants_count: number;
  created_at: string;
  budget_min: number | null;
  budget_max: number | null;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  proposed_amount: number | null;
  cover_letter: string | null;
  gig: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

const EmployerDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeGigs: 0,
    totalApplications: 0,
    studentsHired: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch employer's gigs
      const { data: gigsData, error: gigsError } = await supabase
        .from('gigs')
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });

      if (gigsError) throw gigsError;
      setGigs(gigsData || []);

      // Fetch applications for employer's gigs
      const gigIds = gigsData?.map(g => g.id) || [];
      if (gigIds.length > 0) {
        const { data: appsData, error: appsError } = await supabase
          .from('gig_applications')
          .select(`
            *,
            gig:gigs(id, title),
            student:users!gig_applications_student_id_fkey(id, name, profile_image)
          `)
          .in('gig_id', gigIds)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        setApplications(appsData || []);

        // Calculate stats
        setStats({
          activeGigs: gigsData?.filter(g => g.status === 'open').length || 0,
          totalApplications: appsData?.length || 0,
          studentsHired: appsData?.filter(a => a.status === 'accepted').length || 0,
          totalSpent: 0 // Calculate from transactions later
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('gig_applications')
        .update({ status: action })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: action === 'accepted' ? "Application Accepted" : "Application Rejected",
        description: action === 'accepted' 
          ? "The student has been notified" 
          : "The application has been declined"
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Employer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your gigs and find talented students
          </p>
        </div>
        <Link to="/post-gig">
          <Button className="mt-4 md:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Post a Gig
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeGigs}</p>
                <p className="text-sm text-muted-foreground">Active Gigs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.studentsHired}</p>
                <p className="text-sm text-muted-foreground">Students Hired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₦{stats.totalSpent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">
            Applications
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {applications.filter(a => a.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-gigs">My Gigs</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet</p>
                  <p className="text-sm">Post a gig to start receiving applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 10).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {app.student?.profile_image ? (
                            <img src={app.student.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium">{app.student?.name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{app.student?.name}</p>
                          <p className="text-sm text-muted-foreground">Applied for: {app.gig?.title}</p>
                          {app.proposed_amount && (
                            <p className="text-sm text-primary font-medium">
                              Proposed: ₦{app.proposed_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {app.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplicationAction(app.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApplicationAction(app.id, 'accepted')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                          </>
                        ) : (
                          <Badge variant={app.status === 'accepted' ? 'default' : 'secondary'}>
                            {app.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-gigs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Gigs</CardTitle>
              <Link to="/post-gig">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New Gig
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {gigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No gigs posted yet</p>
                  <Link to="/post-gig">
                    <Button className="mt-4">Post Your First Gig</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {gigs.map((gig) => (
                    <div key={gig.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h3 className="font-medium text-foreground">{gig.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {gig.applicants_count} applicants
                          </span>
                          {gig.budget_max && (
                            <span>₦{gig.budget_max.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={gig.status === 'open' ? 'default' : 'secondary'}>
                          {gig.status}
                        </Badge>
                        <Link to={`/gig/${gig.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerDashboard;
