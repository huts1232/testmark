'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setState(prev => ({ ...prev, error: sessionError.message, loading: false }));
          return;
        }

        if (session?.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            setState(prev => ({ 
              ...prev, 
              user: session.user,
              error: 'Failed to load profile',
              loading: false 
            }));
            return;
          }

          setState({
            user: session.user,
            profile: profile || null,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Authentication error',
          loading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            setState({
              user: null,
              profile: null,
              loading: false,
              error: null,
            });
          } else if (session?.user) {
            // Fetch updated profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              setState(prev => ({ 
                ...prev, 
                user: session.user,
                error: 'Failed to load profile',
                loading: false 
              }));
              return;
            }

            setState({
              user: session.user,
              profile: profile || null,
              loading: false,
              error: null,
            });
          } else {
            setState(prev => ({ ...prev, loading: false }));
          }
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: error instanceof Error ? error.message : 'Authentication error',
            loading: false 
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      return { success: false, error: message };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        profile: profile,
        loading: false,
        error: null,
      }));

      return { success: true, data: profile };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      return { success: false, error: message };
    }
  };

  const refreshProfile = async () => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        profile: profile || null,
      }));

      return { success: true, data: profile };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile refresh failed';
      return { success: false, error: message };
    }
  };

  return {
    ...state,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!state.user,
    isPro: state.profile?.plan === 'pro' || state.profile?.plan === 'enterprise',
    isEnterprise: state.profile?.plan === 'enterprise',
  };
}