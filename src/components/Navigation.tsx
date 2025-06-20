
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { LogOut, User, Award } from 'lucide-react';

const Navigation = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-indigo-600">
            UNIOSUN Connect
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_image} />
              <AvatarFallback>
                {profile?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-sm">
              <p className="font-medium">{profile?.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
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
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
