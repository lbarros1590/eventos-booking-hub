import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | null;

export interface Profile {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  reservation_count: number;
  has_discount: boolean;
  loyalty_points: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone: string, birthDate?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = async () => {
    console.warn("Sessão inválida ou erro crítico. Deslogando usuário...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: roleData, error: roleError } = await (supabase as any)
        .rpc('get_user_role', { _user_id: userId });

      if (roleError) {
        console.error("Erro ao buscar cargo:", roleError);
        setRole('user');
      } else {
        setRole((roleData as UserRole) || 'user');
      }

    } catch (error) {
      console.error('ERRO CRÍTICO ao buscar dados do usuário:', error);
      await forceLogout();
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthEvent = async (event: string, session: Session | null) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      console.log(`[AUTH] Event: ${event}`, { userId: session?.user?.id });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }

      if (mounted) setLoading(false);
    };

    // Unificamos a inicialização: deixamos o onAuthStateChange cuidar do estado inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthEvent(event, session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, birthDate?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name, phone, birth_date: birthDate || null },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      signIn, signUp, signOut, refreshUserData: () => user ? fetchUserData(user.id) : Promise.resolve()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
