
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GraduationCap, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NotificationBell from '@/components/notifications/NotificationBell';

const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-green-600" />
          <span className="text-xl font-bold text-gray-900">UNIOSUN Tutoring</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && profile ? (
            <>
              <div className="flex items-center gap-2">
                {/* Navigation Links */}
                <Link to="/dashboard">
                  <Button 
                    variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
                    className={location.pathname === '/dashboard' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Dashboard
                  </Button>
                </Link>
                
                {profile.role === 'aspirant' && (
                  <Link to="/talents">
                    <Button 
                      variant={location.pathname === '/talents' ? 'default' : 'ghost'}
                      className={location.pathname === '/talents' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      Find Talents
                    </Button>
                  </Link>
                )}

                {profile.role === 'admin' && (
                  <Link to="/admin">
                    <Button 
                      variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                      className={location.pathname === '/admin' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell />
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.profile_image || undefined} alt={profile.name} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
