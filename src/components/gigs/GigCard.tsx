import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Wallet, 
  Users, 
  Star,
  Zap,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";

interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description: string;
    category: string;
    location_type: string;
    city?: string;
    state?: string;
    budget_min?: number;
    budget_max?: number;
    payment_type?: string;
    duration_estimate?: string;
    is_featured?: boolean;
    applicants_count?: number;
    created_at: string;
    employer?: {
      name: string;
      employer_verified?: boolean;
      company_name?: string;
    };
  };
  onApply?: () => void;
  showApplyButton?: boolean;
}

const categoryColors: Record<string, string> = {
  'micro-jobs': 'bg-blue-100 text-blue-700',
  'freelance': 'bg-purple-100 text-purple-700',
  'campus-hustles': 'bg-green-100 text-green-700',
  'internships': 'bg-orange-100 text-orange-700',
  'remote': 'bg-cyan-100 text-cyan-700',
  'tutoring': 'bg-yellow-100 text-yellow-700',
  'delivery': 'bg-red-100 text-red-700',
  'events': 'bg-pink-100 text-pink-700',
  'design': 'bg-indigo-100 text-indigo-700',
  'writing': 'bg-emerald-100 text-emerald-700',
  'tech': 'bg-violet-100 text-violet-700',
};

const formatBudget = (min?: number, max?: number, paymentType?: string) => {
  if (!min && !max) return 'Negotiable';
  const suffix = paymentType === 'hourly' ? '/hr' : '';
  if (min && max && min !== max) {
    return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}${suffix}`;
  }
  return `₦${(max || min)?.toLocaleString()}${suffix}`;
};

const formatLocation = (locationType: string, city?: string, state?: string) => {
  switch (locationType) {
    case 'remote': return 'Remote';
    case 'nationwide': return 'Nationwide';
    case 'campus': return city ? `${city}, ${state}` : 'Campus';
    case 'city': return city || 'City-based';
    case 'state': return state || 'State-wide';
    default: return locationType;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const GigCard = ({ gig, onApply, showApplyButton = true }: GigCardProps) => {
  return (
    <Card className={`hover:shadow-lg transition-all bg-card border-border ${gig.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {gig.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge className={`text-xs ${categoryColors[gig.category] || 'bg-gray-100 text-gray-700'}`}>
                {gig.category.replace('-', ' ')}
              </Badge>
            </div>
            <Link to={`/gig/${gig.id}`}>
              <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                {gig.title}
              </h3>
            </Link>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {gig.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{formatLocation(gig.location_type, gig.city, gig.state)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="w-4 h-4" />
            <span className="font-medium text-foreground">
              {formatBudget(gig.budget_min, gig.budget_max, gig.payment_type)}
            </span>
          </div>
          {gig.duration_estimate && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{gig.duration_estimate}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {gig.employer && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {gig.employer.company_name || gig.employer.name}
                </span>
                {gig.employer.employer_verified && (
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Verified
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{gig.applicants_count || 0}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(gig.created_at)}
            </span>
          </div>
        </div>

        {/* Apply Button */}
        {showApplyButton && (
          <Button 
            className="w-full mt-4" 
            onClick={onApply}
          >
            Apply Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GigCard;
