import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | null;

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  reservation_count: number;
  has_discount: boolean;
  birth_date: string | null;
  loyalty_points: number;
}

export interface Booking {
  id: string;
  user_id: string;
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
  user_id: string;
  booking_date: string;
  price: number;
  cleaning_fee: number;
  total_price: number;
  status: 'pending' | 'confirmed';
  deposit_paid: boolean;
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
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'user_id'>) => Promise<{ error: Error | null }>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  grantDiscount: (userId: string) => Promise<void>;
  isDateBooked: (date: Date) => boolean;
  calculatePrice: (date: Date) => { basePrice: number; cleaningFee: number; total: number };
  refreshData: () => Promise<void>;
  createManualClient: (data: ManualClientData) => Promise<{ error: Error | null; profile: Profile | null }>;
  createManualBooking: (data: ManualBookingData) => Promise<{ error: Error | null }>;
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
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role using the database function
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      setRole((roleData as UserRole) || 'user');
    } catch (error) {
      console.error('Error fetching user data:', error);
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
          .select('*');

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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh data when role changes
  useEffect(() => {
    if (role) {
      refreshData();
    }
  }, [role]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, phone: string, birthDate?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          phone,
          birth_date: birthDate || null,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setProfiles([]);
    setExpenses([]);
  };

  const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_date: booking.booking_date,
        price: booking.price,
        cleaning_fee: booking.cleaning_fee,
        total_price: booking.total_price,
        status: booking.status,
        checklist_confirmed: booking.checklist_confirmed,
        terms_accepted: booking.terms_accepted,
        deposit_paid: booking.deposit_paid || false,
        final_balance_paid: booking.final_balance_paid || false,
        discount_applied: booking.discount_applied || 0,
        origin: booking.origin || 'web',
      });

    if (!error) {
      // Increment reservation count
      if (profile) {
        await supabase
          .from('profiles')
          .update({ reservation_count: profile.reservation_count + 1 })
          .eq('user_id', user.id);
      }
      await refreshData();
      await fetchUserData(user.id);
    }

    return { error };
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    await refreshData();
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await supabase
      .from('expenses')
      .insert({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        expense_date: expense.expense_date,
        payment_date: expense.payment_date,
      });
    
    await refreshData();
  };

  const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id'>>) => {
    await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id);
    
    await refreshData();
  };

  const deleteExpense = async (expenseId: string) => {
    await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    
    await refreshData();
  };

  const grantDiscount = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ has_discount: true })
      .eq('user_id', userId);
    
    await refreshData();
    
    if (user && user.id === userId) {
      await fetchUserData(user.id);
    }
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(
      (b) => b.booking_date === dateStr && b.status !== 'cancelled'
    );
  };

  // This function is now deprecated - use useVenueSettings hook for dynamic pricing
  const calculatePrice = (date: Date): { basePrice: number; cleaningFee: number; total: number } => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const basePrice = isWeekend ? 600 : 400;
    const cleaningFee = 70;
    
    let total = basePrice + cleaningFee;
    
    if (profile?.has_discount) {
      total = total * 0.8;
    }
    
    return { basePrice, cleaningFee, total };
  };

  const createManualClient = async (data: ManualClientData): Promise<{ error: Error | null; profile: Profile | null }> => {
    // Create a pseudo user_id for manual clients (they don't have auth accounts)
    const pseudoUserId = crypto.randomUUID();
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .insert({
        user_id: pseudoUserId,
        name: data.name,
        phone: data.phone,
        birth_date: data.birth_date,
        email: data.email || null,
        reservation_count: 0,
        has_discount: false,
        loyalty_points: 0,
      })
      .select()
      .single();
    
    if (!error) {
      await refreshData();
    }
    
    return { error, profile: profileData as Profile | null };
  };

  const createManualBooking = async (data: ManualBookingData): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: data.user_id,
        booking_date: data.booking_date,
        price: data.price,
        cleaning_fee: data.cleaning_fee,
        total_price: data.total_price,
        status: data.status,
        deposit_paid: data.deposit_paid,
        origin: data.origin,
        checklist_confirmed: true,
        terms_accepted: true,
      });
    
    if (!error) {
      // Increment reservation count for the user
      const targetProfile = profiles.find(p => p.user_id === data.user_id);
      if (targetProfile) {
        await supabase
          .from('profiles')
          .update({ reservation_count: targetProfile.reservation_count + 1 })
          .eq('user_id', data.user_id);
      }
      await refreshData();
    }
    
    return { error };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        profiles,
        bookings,
        expenses,
        loading,
        signIn,
        signUp,
        signOut,
        createBooking,
        updateBookingStatus,
        addExpense,
        updateExpense,
        deleteExpense,
        grantDiscount,
        isDateBooked,
        calculatePrice,
        refreshData,
        createManualClient,
        createManualBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
