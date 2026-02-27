import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, Profile } from './AuthContext';

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

interface DataContextType {
    profiles: Profile[];
    bookings: Booking[];
    expenses: Expense[];
    refreshData: () => Promise<void>;
    createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'user_id' | 'profile_id'>) => Promise<{ error: Error | null }>;
    updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
    updateBooking: (bookingId: string, data: Partial<Booking>) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
    deleteExpense: (expenseId: string) => Promise<void>;
    grantDiscount: (profileId: string) => Promise<void>;
    isDateBooked: (date: Date) => boolean;
    createManualClient: (data: ManualClientData) => Promise<{ error: Error | null; profile: Profile | null }>;
    createManualBooking: (data: ManualBookingData) => Promise<{ error: Error | null }>;
    getProfileById: (profileId: string) => Profile | undefined;
    refreshProfiles: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, profile, role, refreshUserData } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

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

    const refreshProfiles = async () => {
        try {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('name', { ascending: true });
            if (profilesData) setProfiles(profilesData as Profile[]);
        } catch (error) {
            console.error('Error refreshing profiles:', error);
        }
    };

    useEffect(() => {
        refreshData();
    }, [role]);

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
            await refreshUserData();
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
        if (user && profile && profile.id === profileId) await refreshUserData();
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
        <DataContext.Provider value={{
            profiles, bookings, expenses, refreshData, createBooking, updateBookingStatus,
            updateBooking, addExpense, updateExpense, deleteExpense, grantDiscount,
            isDateBooked, createManualClient, createManualBooking, refreshProfiles,
            getProfileById: (id) => profiles.find(p => p.id === id),
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
