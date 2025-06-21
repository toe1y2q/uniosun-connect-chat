
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { LogOut, User, Award, Home, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="bg-white border-b border-green-200 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              UNIOSUN Connect
            </div>
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
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-green-200">
              <AvatarImage src={profile?.profile_image} />
              <AvatarFallback className="bg-green-100 text-green-700">
                {profile?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-sm">
              <p className="font-medium text-gray-900">{profile?.name}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-green-200 text-green-700"
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
            className="text-gray-600 hover:text-green-700 hover:bg-green-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
