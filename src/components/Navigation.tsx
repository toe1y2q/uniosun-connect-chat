import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { LogOut, User, Award, Home, Briefcase, Shield, BookOpen, CreditCard, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';

const Navigation = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'border-destructive/50 text-destructive';
      case 'employer': return 'border-blue-500/50 text-blue-600';
      case 'student': return 'border-primary/50 text-primary';
      default: return 'border-muted-foreground/50 text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/bbe1b728-9234-4e9e-95cd-e4112dd8873c.png" 
              alt="Hireveno Logo" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            <Link to="/gigs">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Briefcase className="w-4 h-4 mr-2" />
                Browse Gigs
              </Button>
            </Link>

            {profile?.role === 'employer' && (
              <Link to="/post-gig">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Gig
                </Button>
              </Link>
            )}

            {(profile?.role === 'student' || profile?.role === 'aspirant') && (
              <Link to="/withdrawals">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Withdrawals
                </Button>
              </Link>
            )}

            {profile?.role === 'student' && !profile?.badge && profile?.is_verified && (
              <Link to="/quiz">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Take Quiz
                </Button>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link to="/admin">
                <Button 
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={location.pathname === '/admin' 
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                    : "text-destructive hover:text-destructive hover:bg-destructive/10"
                  }
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell />
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-border">
              <AvatarImage src={profile?.profile_image} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {profile?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-sm hidden md:block">
              <p className="font-medium text-foreground truncate max-w-[120px]">{profile?.name}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getRoleBadgeStyle(profile?.role || '')}`}
                >
                  {profile?.role}
                </Badge>
                {profile?.badge && (
                  <Badge className="bg-primary/10 text-primary text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground hover:bg-accent p-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
