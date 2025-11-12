import { Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { AuthContextType, Profile, User } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const createUserProfile = async (userId: string, name: string, email: string): Promise<Profile> => {
    try {
      console.log('Creating profile for user:', userId);

      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=256&bold=true`;

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name.trim(),
          avatar_url: avatarUrl,
          bio: null,
        })
        .select()
        .maybeSingle();


      if (error) {
        console.error('Profile creation error:', error);

        if (error.code === '23505') {
          console.log('Profile already exists, fetching...');
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (fetchError) {
            throw new Error(`Failed to create or fetch profile: ${fetchError.message}`);
          }
          return existingProfile;
        }

        throw error;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error in createUserProfile:', error);
      throw error;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const handleSession = async (session: Session | null) => {
    if (session?.user) {
      setUser(session.user as User);
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    try {
      console.log('Starting signup process for:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        console.error('Signup auth error:', error);

        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        } else if (error.message.includes('password')) {
          throw new Error('Password does not meet requirements. Please use a stronger password.');
        } else if (error.message.includes('email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw error;
        }
      }

      console.log('Auth signup successful:', data.user?.id);

      if (data.user) {
        try {
          console.log('Creating user profile...');
          await createUserProfile(data.user.id, name, email);
          console.log('Profile creation completed');
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
        }
      }

      if (data.session === null && data.user?.identities?.length === 0) {
        console.log('Email confirmation required');
        return;
      }

      console.log('Signup process completed successfully');

    } catch (error) {
      console.error('Signup process failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      console.error('Signin error:', error);

      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email to verify your account before logging in.');
      } else {
        throw error;
      }
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('Attempting sign out...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        setUser(null);
        setProfile(null);
        throw error;
      }

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error: updateError, count } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*');

      if (updateError) throw updateError;

      if (count === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, name: user.email?.split('@')[0] || 'User', ...updates });

        if (insertError) throw insertError;
      }

      await fetchProfile(user.id);

    } catch (error) {
      console.error('Failed to update or create profile:', error);
      throw error;
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};