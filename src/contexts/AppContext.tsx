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
  signUp: (email: string, password: string, name: string, phone: string, birthDate?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'user_id' | 'profile_id'>) => Promise<{ error: Error | null }>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  updateBooking: (bookingId: string, data: Partial<Booking>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  grantDiscount: (profileId: string) => Promise<void>;
  isDateBooked: (date: Date) => boolean;
  calculatePrice: (date: Date) => { basePrice: number; cleaningFee: number; total: number };
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

  // Fetch user profile and role
  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for:", userId);
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); 

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role using the database function
      const { data: roleData, error } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (roleData) {
        setRole(roleData as UserRole);
      } else {
        setRole('user');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setRole('user'); // Fallback seguro
    }
  };

  // Fetch all data
  const refreshData = async () => {
    try {
      // Fetch all bookings (for checking availability)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });

      if (bookingsData) {
        setBookings(bookingsData as Booking[]);
      }

      // If admin, fetch all profiles and expenses
      if (role === 'admin') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });

        if (profilesData) {
          setProfiles(profilesData as Profile[]);
        }

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (expensesData) {
          setExpenses(expensesData as Expense[]);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Setup auth state listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserData(session.user.id);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setLoading(true);
            await fetchUserData(session.user.id);
            setLoading(false);
          } else {
            setProfile(null);
            setRole(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh data when role changes
  useEffect(() => {
    if (role) {
      refreshData();
    }
  }, [role]);

  // --- FUNÇÕES DE AUTH ---

  // ✅ AQUI ESTÁ A CORREÇÃO: REINSERI A FUNÇÃO SIGNIN
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, phone: string, birthDate?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log("Enviando cadastro:", { email, name, phone, birth_date: birthDate });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
          phone: phone,
          birth_date: birthDate || null
        },
      },
    });

    if (error) {
        console.error("Erro no Supabase Auth:", error);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setProfiles([]);
    setExpenses([]);
  };

  // --- GETTERS ---
  const getProfileById = (profileId: string) => profiles.find(p => p.id === profileId);
  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId);

  // --- ACTIONS ---
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

  const calculatePrice = (date: Date) => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    let basePrice = isWeekend ? 600 : 400;
    const cleaningFee = 70;
    
    if (profile?.has_discount) {
        basePrice = basePrice * 0.8; 
    }

    const total = basePrice + cleaningFee;
    return { basePrice, cleaningFee, total };
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
        calculatePrice, refreshData, createManualClient, createManualBooking,
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
