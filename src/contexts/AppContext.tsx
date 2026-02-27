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
  cpf: string | null;
  rg: string | null;
  address: string | null;
  reservation_count: number;
  has_discount: boolean;
  loyalty_points: number;
}

export interface Booking {
  id: string;
  user_id: string;
  profile_id: string | null;
  booking_date: string;
  price: number;
  cleaning_fee: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  checklist_confirmed: boolean;
  terms_accepted: boolean;
  created_at: string;
  deposit_paid: boolean;
  final_balance_paid: boolean;
  manual_price_override: number | null;
  waive_cleaning_fee: boolean;
  custom_checklist_items: any[] | null;
  discount_applied: number;
  origin: 'web' | 'admin_manual';
  payment_method: string | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'electricity' | 'water' | 'maintenance' | 'other';
  expense_date: string;
  payment_date: string | null;
}

interface ManualClientData {
  name: string;
  phone: string;
  birth_date: string | null;
  email?: string | null;
  cpf?: string | null;
  rg?: string | null;
  address?: string | null;
}

interface ManualBookingData {
  profile_id: string;
  booking_date: string;
  price: number;
  cleaning_fee: number;
  total_price: number;
  status: 'pending' | 'confirmed';
  deposit_paid: boolean;
  payment_method?: string | null;
  origin: 'admin_manual';
}

interface AppContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  profiles: Profile[];
  bookings: Booking[];
  expenses: Expense[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone: string, birthDate?: string, cpf?: string, address?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'user_id' | 'profile_id'>) => Promise<{ error: Error | null }>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  updateBooking: (bookingId: string, data: Partial<Booking>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  grantDiscount: (profileId: string) => Promise<void>;
  isDateBooked: (date: Date) => boolean;
  refreshData: () => Promise<void>;
  createManualClient: (data: ManualClientData) => Promise<{ error: Error | null; profile: Profile | null }>;
  createManualBooking: (data: ManualBookingData) => Promise<{ error: Error | null }>;
  getProfileById: (profileId: string) => Profile | undefined;
  getProfileByUserId: (userId: string) => Profile | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FUNÇÃO DE EMERGÊNCIA: LOGOUT FORÇADO ---
  const forceLogout = async () => {
    console.warn("Sessão inválida ou erro crítico. Deslogando usuário...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
    // Redireciona para home ou login para limpar a URL
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for:", userId);

      // 1. Tenta buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        throw profileError; // Joga pro catch para deslogar se der erro de banco
      }

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        // Se não tem perfil, cria um log mas não trava o app
        console.warn("Usuário logado mas sem perfil.");
      }

      // 2. Tenta buscar cargo
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (roleError) {
        console.error("Erro ao buscar cargo:", roleError);
        // Não vamos deslogar por erro de cargo, apenas assume 'user'
        setRole('user');
      } else if (roleData) {
        setRole(roleData as UserRole);
      } else {
        setRole('user');
      }

    } catch (error) {
      console.error('ERRO CRÍTICO ao buscar dados do usuário:', error);
      // AQUI ESTÁ A SOLUÇÃO DO LOOP:
      // Se deu erro ao buscar os dados, a sessão provavelmente está "suja".
      // Vamos deslogar para obrigar o usuário a entrar de novo limpo.
      await forceLogout();
    }
  };

  const refreshData = async () => {
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });

      if (bookingsData) setBookings(bookingsData as Booking[]);

      if (role === 'admin') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });
        if (profilesData) setProfiles(profilesData as Profile[]);

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false });
        if (expensesData) setExpenses(expensesData as Expense[]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Pega a sessão inicial sem setar loading(true) ainda para não piscar
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserData(session.user.id);
          }
          // Sempre carrega os dados públicos (calendário)
          await refreshData();
        }
      } catch (error) {
        console.error("Erro na inicialização da Auth:", error);
        await forceLogout();
      } finally {
        if (mounted) {
          setLoading(false); // GARANTE QUE O LOADING PARA
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Evita re-processar se for apenas um "TOKEN_REFRESHED" que causa loops
        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        console.log("Evento de Auth:", event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Só ativa loading se for um login explícito
          if (event === 'SIGNED_IN') setLoading(true);

          await fetchUserData(session.user.id);
          await refreshData();
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
          setLoading(false);
          refreshData();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (role) refreshData();
  }, [role]);

  // --- ACTIONS ---

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, birthDate?: string, cpf?: string, address?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, phone, birth_date: birthDate || null, cpf: cpf || null, address: address || null },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Limpeza completa de estado
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfiles([]);
    setExpenses([]);
    window.location.href = '/';
  };

  // ... (Getters e Actions permanecem iguais)
  const getProfileById = (profileId: string) => profiles.find(p => p.id === profileId);
  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId);

  const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'user_id' | 'profile_id'>) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('bookings').insert({
      user_id: user.id, profile_id: profile.id, ...booking,
      deposit_paid: booking.deposit_paid || false,
      final_balance_paid: booking.final_balance_paid || false,
      discount_applied: booking.discount_applied || 0,
      origin: booking.origin || 'web',
    });
    if (!error) {
      await supabase.from('profiles').update({ reservation_count: profile.reservation_count + 1 }).eq('id', profile.id);
      await refreshData();
      await fetchUserData(user.id);
    }
    return { error };
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    await refreshData();
  };

  const updateBooking = async (bookingId: string, data: Partial<Booking>) => {
    await supabase.from('bookings').update(data).eq('id', bookingId);
    await refreshData();
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await supabase.from('expenses').insert(expense);
    await refreshData();
  };

  const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id'>>) => {
    await supabase.from('expenses').update(expense).eq('id', id);
    await refreshData();
  };

  const deleteExpense = async (expenseId: string) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    await refreshData();
  };

  const grantDiscount = async (profileId: string) => {
    await supabase.from('profiles').update({ has_discount: true }).eq('id', profileId);
    await refreshData();
    if (user && profile && profile.id === profileId) await fetchUserData(user.id);
  };

  const isDateBooked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some((b) => b.booking_date === dateStr && b.status !== 'cancelled');
  };



  const createManualClient = async (data: ManualClientData) => {
    const { data: profileData, error } = await supabase.from('profiles').insert({
      user_id: null, ...data, reservation_count: 0, has_discount: false, loyalty_points: 0,
    }).select().single();
    if (!error) await refreshData();
    return { error, profile: profileData as Profile | null };
  };

  const createManualBooking = async (data: ManualBookingData) => {
    const targetProfile = profiles.find(p => p.id === data.profile_id);
    const { error } = await supabase.from('bookings').insert({
      user_id: targetProfile?.user_id || null, ...data, checklist_confirmed: true, terms_accepted: true,
    });
    if (!error && targetProfile) {
      await supabase.from('profiles').update({ reservation_count: targetProfile.reservation_count + 1 }).eq('id', data.profile_id);
      await refreshData();
    }
    return { error };
  };

  return (
    <AppContext.Provider value={{
      user, session, profile, role, profiles, bookings, expenses, loading,
      signIn, signUp, signOut, createBooking, updateBookingStatus, updateBooking,
      addExpense, updateExpense, deleteExpense, grantDiscount, isDateBooked,
      refreshData, createManualClient, createManualBooking,
      getProfileById, getProfileByUserId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
