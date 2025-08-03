
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { LogOut, User, Award, Home, Eye, Shield, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';

const Navigation = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="bg-white border-b border-green-200 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/f8c01903-66a0-4f99-82df-b1a9d9aeac4b.png" 
              alt="Hireveno Logo" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-700 hover:bg-green-50">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/talents">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-700 hover:bg-green-50">
                <Eye className="w-4 h-4 mr-2" />
                Browse Talents
              </Button>
            </Link>
            {profile?.role === 'student' && !profile?.badge && profile?.is_verified && (
              <Link to="/quiz">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
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
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-green-200">
              <AvatarImage src={profile?.profile_image} />
              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                {profile?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-sm hidden md:block">
              <p className="font-medium text-gray-900 truncate max-w-[120px]">{profile?.name}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    profile?.role === 'admin' 
                      ? 'border-red-200 text-red-700' 
                      : 'border-green-200 text-green-700'
                  }`}
                >
                  {profile?.role}
                </Badge>
                {profile?.badge && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
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
            className="text-gray-600 hover:text-green-700 hover:bg-green-50 p-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
