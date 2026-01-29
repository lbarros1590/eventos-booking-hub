import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export interface ChecklistItem {
  id: number;
  item: string;
  checked: boolean;
}

export interface VenueSettings {
  id: string;
  base_price_weekday: number;
  base_price_weekend: number;
  cleaning_fee: number;
  global_discount_percent: number;
  hero_image_url: string | null;
  gallery_urls: string[];
  payment_terms_text: string;
  default_checklist_items: ChecklistItem[];
  amenities_list: Amenity[];
}

export interface CalendarException {
  id: string;
  exception_date: string;
  custom_price: number | null;
  is_blocked: boolean;
  note: string | null;
}

export const useVenueSettings = () => {
  const [settings, setSettings] = useState<VenueSettings | null>(null);
  const [calendarExceptions, setCalendarExceptions] = useState<CalendarException[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          ...data,
          amenities_list: (data.amenities_list as unknown as Amenity[]) || [],
          gallery_urls: (data.gallery_urls as string[]) || [],
          payment_terms_text: (data.payment_terms_text as string) || '50% no ato da reserva, 50% na entrega das chaves.',
          default_checklist_items: (data.default_checklist_items as unknown as ChecklistItem[]) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching venue settings:', error);
    }
  };

  const fetchCalendarExceptions = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .select('*')
        .order('exception_date', { ascending: true });

      if (error) throw error;

      setCalendarExceptions(data || []);
    } catch (error) {
      console.error('Error fetching calendar exceptions:', error);
    }
  };

  const updateSettings = async (updates: Partial<VenueSettings>) => {
    if (!settings?.id) return { error: new Error('No settings found') };

    // Convert amenities_list to JSON-compatible format if present
    const dbUpdates: Record<string, unknown> = { ...updates };
    if (updates.amenities_list) {
      dbUpdates.amenities_list = updates.amenities_list as unknown;
    }
    if (updates.default_checklist_items) {
      dbUpdates.default_checklist_items = updates.default_checklist_items as unknown;
    }

    const { error } = await supabase
      .from('venue_settings')
      .update(dbUpdates)
      .eq('id', settings.id);

    if (!error) {
      await fetchSettings();
    }

    return { error };
  };

  const addCalendarException = async (exception: Omit<CalendarException, 'id'>) => {
    const { error } = await supabase
      .from('calendar_exceptions')
      .insert(exception);

    if (!error) {
      await fetchCalendarExceptions();
    }

    return { error };
  };

  const updateCalendarException = async (id: string, updates: Partial<CalendarException>) => {
    const { error } = await supabase
      .from('calendar_exceptions')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await fetchCalendarExceptions();
    }

    return { error };
  };

  const deleteCalendarException = async (id: string) => {
    const { error } = await supabase
      .from('calendar_exceptions')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchCalendarExceptions();
    }

    return { error };
  };

  const calculatePriceForDate = (
    date: Date, 
    hasLoyaltyDiscount: boolean = false,
    waiveCleaningFee: boolean = false
  ): { basePrice: number; cleaningFee: number; total: number; deposit: number } => {
    if (!settings) {
      return { basePrice: 0, cleaningFee: 0, total: 0, deposit: 0 };
    }

    const dateStr = date.toISOString().split('T')[0];
    const exception = calendarExceptions.find(e => e.exception_date === dateStr);

    let basePrice: number;

    // 1. Check calendar exceptions first
    if (exception?.custom_price !== null && exception?.custom_price !== undefined) {
      basePrice = exception.custom_price;
    } else {
      // 2. Check if weekend (Fri/Sat/Sun)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      basePrice = isWeekend ? settings.base_price_weekend : settings.base_price_weekday;
    }

    // Apply global discount
    if (settings.global_discount_percent > 0) {
      basePrice = basePrice * (1 - settings.global_discount_percent / 100);
    }

    const cleaningFee = waiveCleaningFee ? 0 : settings.cleaning_fee;
    let total = basePrice + cleaningFee;

    // Apply loyalty discount
    if (hasLoyaltyDiscount) {
      total = total * 0.8;
    }

    const roundedTotal = Math.round(total);
    const deposit = Math.round(roundedTotal / 2);

    return { basePrice: Math.round(basePrice), cleaningFee, total: roundedTotal, deposit };
  };

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarExceptions.some(e => e.exception_date === dateStr && e.is_blocked);
  };

  const getExceptionForDate = (date: Date): CalendarException | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarExceptions.find(e => e.exception_date === dateStr);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchCalendarExceptions()]);
      setLoading(false);
    };
    load();
  }, []);

  return {
    settings,
    calendarExceptions,
    loading,
    updateSettings,
    addCalendarException,
    updateCalendarException,
    deleteCalendarException,
    calculatePriceForDate,
    isDateBlocked,
    getExceptionForDate,
    refreshSettings: fetchSettings,
    refreshExceptions: fetchCalendarExceptions,
  };
};
