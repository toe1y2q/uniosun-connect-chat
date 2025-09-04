import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser && event !== 'SIGNED_OUT') {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const createAdminProfile = async (userId: string, email: string) => {
    try {
      const adminProfile = {
        id: userId,
        email: email,
        name: 'Admin User',
        role: 'admin' as const,
        is_verified: true,
        badge: false,
        wallet_balance: 0,
      };

      const { data, error } = await supabase
        .from('users')
        .insert(adminProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating admin profile:', error);
        return;
      }

      console.log('Admin profile created:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in createAdminProfile:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Use AbortController for proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Profile fetch aborted due to timeout');
      }, 10000); // Reduced to 10 seconds
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // Don't return here, let it fall through to handle potential admin case
        if (error.name === 'AbortError') {
          console.error('Profile fetch timeout - forcing signout');
          await signOut();
          return;
        }
      }

      if (data) {
        console.log('Profile fetched:', data);
        setProfile(data);
      } else {
        console.log('No profile found for user, checking if admin user exists in auth');
        // For admin users who might exist in auth but not in users table
        try {
          const currentUser = await supabase.auth.getUser();
          const adminEmails = ['tolu8610@gmail.com', 'pithyentertainment@gmail.com', 'pithyentertaiment@gmail.com'];
          
          if (currentUser.data.user?.email && adminEmails.includes(currentUser.data.user.email)) {
            console.log('Admin user detected, creating admin profile for:', currentUser.data.user.email);
            await createAdminProfile(userId, currentUser.data.user.email);
          } else {
            console.log('No profile found and not an admin email, setting profile to null');
            setProfile(null);
          }
        } catch (adminCheckError) {
          console.error('Error checking admin user:', adminCheckError);
          setProfile(null);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      
      // If it's a timeout/abort error, force signout to clear stuck state
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.error('Critical profile fetch error - forcing signout to recover');
        await signOut();
        return;
      }
      
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Starting signup process for:', email, 'as role:', userData.role);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      console.log('Auth user created:', authData.user?.id);

      // If auth user was created, create the profile
      if (authData.user) {
        console.log('Creating user profile...');
        const profileData = {
          id: authData.user.id,
          email,
          name: userData.name,
          role: userData.role,
          jamb_reg: userData.jamb_reg || null,
          department_id: userData.department_id || null,
          is_verified: false,
          badge: false,
          wallet_balance: 0,
        };

        console.log('Profile data to insert:', profileData);

        const { data: profileResult, error: profileError } = await supabase
          .from('users')
          .insert(profileData)
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        console.log('Profile created successfully:', profileResult);
        setProfile(profileResult);
      }

      return { data: authData, error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful');
      }
      
      return { data, error };
    } catch (error) {
      console.error('SignIn error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('SignOut error:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh profile after update
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
