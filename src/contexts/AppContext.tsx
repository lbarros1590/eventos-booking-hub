import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'user' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  reservationCount: number;
  hasDiscount: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  date: Date;
  price: number;
  cleaningFee: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  checklistConfirmed: boolean;
  termsAccepted: boolean;
  createdAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'electricity' | 'water' | 'maintenance' | 'other';
  date: Date;
}

interface AppContextType {
  user: User | null;
  users: User[];
  bookings: Booking[];
  expenses: Expense[];
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, name: string, phone: string) => boolean;
  logout: () => void;
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  grantDiscount: (userId: string) => void;
  isDateBooked: (date: Date) => boolean;
  calculatePrice: (date: Date) => { basePrice: number; cleaningFee: number; total: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const initialUsers: User[] = [
  {
    id: '1',
    email: 'admin@ejeventos.com',
    name: 'Leiner (Admin)',
    phone: '65 99286 0607',
    role: 'admin',
    reservationCount: 0,
    hasDiscount: false,
  },
  {
    id: '2',
    email: 'cliente@teste.com',
    name: 'Maria Silva',
    phone: '65 99999 0000',
    role: 'user',
    reservationCount: 3,
    hasDiscount: false,
  },
];

const initialBookings: Booking[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Maria Silva',
    userPhone: '65 99999 0000',
    date: new Date(2025, 1, 15),
    price: 600,
    cleaningFee: 70,
    totalPrice: 670,
    status: 'confirmed',
    checklistConfirmed: true,
    termsAccepted: true,
    createdAt: new Date(2025, 0, 20),
  },
  {
    id: '2',
    userId: '2',
    userName: 'Maria Silva',
    userPhone: '65 99999 0000',
    date: new Date(2025, 1, 22),
    price: 400,
    cleaningFee: 70,
    totalPrice: 470,
    status: 'pending',
    checklistConfirmed: true,
    termsAccepted: true,
    createdAt: new Date(2025, 1, 1),
  },
];

const initialExpenses: Expense[] = [
  { id: '1', description: 'Conta de Luz - Janeiro', amount: 350, category: 'electricity', date: new Date(2025, 0, 15) },
  { id: '2', description: 'Conta de Água - Janeiro', amount: 120, category: 'water', date: new Date(2025, 0, 15) },
  { id: '3', description: 'Manutenção Piscina', amount: 200, category: 'maintenance', date: new Date(2025, 0, 20) },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const login = (email: string, password: string): boolean => {
    // Mock login - in production, validate against backend
    const foundUser = users.find((u) => u.email === email);
    if (foundUser && password.length >= 6) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = (email: string, password: string, name: string, phone: string): boolean => {
    if (users.find((u) => u.email === email)) {
      return false;
    }
    const newUser: User = {
      id: String(users.length + 1),
      email,
      name,
      phone,
      role: 'user',
      reservationCount: 0,
      hasDiscount: false,
    };
    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const createBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: String(bookings.length + 1),
      createdAt: new Date(),
    };
    setBookings([...bookings, newBooking]);
    
    // Update user reservation count
    if (user) {
      const updatedUser = { ...user, reservationCount: user.reservationCount + 1 };
      setUser(updatedUser);
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    }
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: String(expenses.length + 1),
    };
    setExpenses([...expenses, newExpense]);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
  };

  const grantDiscount = (userId: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, hasDiscount: true } : u)));
    if (user?.id === userId) {
      setUser({ ...user, hasDiscount: true });
    }
  };

  const isDateBooked = (date: Date): boolean => {
    return bookings.some(
      (b) =>
        b.date.toDateString() === date.toDateString() &&
        b.status !== 'cancelled'
    );
  };

  const calculatePrice = (date: Date): { basePrice: number; cleaningFee: number; total: number } => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Fri, Sat, Sun
    const basePrice = isWeekend ? 600 : 400;
    const cleaningFee = 70;
    
    let total = basePrice + cleaningFee;
    
    // Apply discount if user has it
    if (user?.hasDiscount) {
      total = total * 0.8; // 20% off
    }
    
    return { basePrice, cleaningFee, total };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        bookings,
        expenses,
        login,
        register,
        logout,
        createBooking,
        updateBookingStatus,
        addExpense,
        deleteExpense,
        grantDiscount,
        isDateBooked,
        calculatePrice,
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
