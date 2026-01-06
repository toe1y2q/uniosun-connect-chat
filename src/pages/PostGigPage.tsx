import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Loader2, Briefcase, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { value: 'micro-jobs', label: 'Micro Jobs', description: 'Quick tasks that can be done in a few hours' },
  { value: 'freelance', label: 'Freelance', description: 'Project-based work' },
  { value: 'campus-hustles', label: 'Campus Hustles', description: 'On-campus opportunities' },
  { value: 'internships', label: 'Internships', description: 'Learning-focused positions' },
  { value: 'remote', label: 'Remote Work', description: 'Work from anywhere' },
  { value: 'tutoring', label: 'Tutoring', description: 'Teaching and mentoring' },
  { value: 'delivery', label: 'Delivery', description: 'Pickup and delivery tasks' },
  { value: 'events', label: 'Events', description: 'Event support and coordination' },
  { value: 'design', label: 'Design', description: 'Graphics, UI/UX, branding' },
  { value: 'writing', label: 'Writing', description: 'Content, copywriting, editing' },
  { value: 'tech', label: 'Tech', description: 'Development, IT support' },
];

const locationTypes = [
  { value: 'remote', label: 'Remote', description: 'Work can be done from anywhere' },
  { value: 'campus', label: 'Campus', description: 'On a specific campus' },
  { value: 'city', label: 'City', description: 'Within a specific city' },
  { value: 'state', label: 'State', description: 'Within a specific state' },
  { value: 'nationwide', label: 'Nationwide', description: 'Anywhere in Nigeria' },
];

const PostGigPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location_type: 'remote',
    city: '',
    state: '',
    budget_min: '',
    budget_max: '',
    payment_type: 'fixed',
    duration_estimate: '',
    is_featured: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post a gig",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('gigs')
        .insert({
          employer_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location_type: formData.location_type,
          city: formData.city || null,
          state: formData.state || null,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
          payment_type: formData.payment_type,
          duration_estimate: formData.duration_estimate || null,
          is_featured: formData.is_featured,
        });

      if (error) throw error;

      toast({
        title: "Gig Posted!",
        description: "Your gig is now live and visible to students",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error posting gig:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post gig",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Post a Gig
          </h1>
          <p className="text-muted-foreground">
            Find talented students to help with your projects
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Gig Details
              </CardTitle>
              <CardDescription>
                Describe what you need done
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Need a Logo Designer for Startup"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work in detail. Include requirements, deliverables, and any specific skills needed..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <span>{cat.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            - {cat.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration Estimate</Label>
                <Input
                  id="duration"
                  placeholder="e.g. 2-3 days, 1 week, Ongoing"
                  value={formData.duration_estimate}
                  onChange={(e) => handleChange('duration_estimate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Where should the work be done?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location_type">Location Type</Label>
                <Select 
                  value={formData.location_type} 
                  onValueChange={(v) => handleChange('location_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        <div>
                          <span>{loc.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            - {loc.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.location_type === 'city' || formData.location_type === 'campus') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Lagos"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g. Lagos"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {formData.location_type === 'state' && (
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g. Lagos"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Budget</CardTitle>
              <CardDescription>
                Set your budget range for this gig
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <Select 
                  value={formData.payment_type} 
                  onValueChange={(v) => handleChange('payment_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">
                    Min Budget (₦)
                  </Label>
                  <Input
                    id="budget_min"
                    type="number"
                    placeholder="e.g. 5000"
                    value={formData.budget_min}
                    onChange={(e) => handleChange('budget_min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">
                    Max Budget (₦)
                  </Label>
                  <Input
                    id="budget_max"
                    type="number"
                    placeholder="e.g. 20000"
                    value={formData.budget_max}
                    onChange={(e) => handleChange('budget_max', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Featured Listing
              </CardTitle>
              <CardDescription>
                Get more visibility for your gig
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Feature this gig</p>
                  <p className="text-sm text-muted-foreground">
                    Featured gigs appear at the top of search results
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => handleChange('is_featured', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Gig'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostGigPage;
