'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  mobile: string;
  address?: string;
} | null;

export type Transaction = {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  shopId: string;
  shopName: string;
  amount: number;
  date: string;
};

type AppContextType = {
  role: 'customer' | 'shopkeeper' | null;
  setRole: (role: 'customer' | 'shopkeeper' | null) => void;
  user: User;
  setUser: (user: User) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  isLoading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<'customer' | 'shopkeeper' | null>(null);
  const [user, setUserState] = useState<User>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
      const storedUser = JSON.parse(localStorage.getItem('udhaarx-user') || 'null');
      const storedTransactions = JSON.parse(localStorage.getItem('udhaarx-transactions') || '[]');
      
      if (storedRole) setRoleState(storedRole);
      if (storedUser) setUserState(storedUser);
      if (storedTransactions) setTransactions(storedTransactions);
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    localStorage.setItem('udhaarx-role', newRole || '');
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('udhaarx-user', JSON.stringify(newUser));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Math.random().toString(36).substring(2, 11)}`,
      date: new Date().toISOString(),
    };
    setTransactions(prev => {
      const updatedTransactions = [...prev, newTransaction];
      localStorage.setItem('udhaarx-transactions', JSON.stringify(updatedTransactions));
      return updatedTransactions;
    });
  };

  const value = {
    role,
    setRole,
    user,
    setUser,
    transactions,
    addTransaction,
    isLoading
  };

  return <AppContext.Provider value={value}>{!isLoading && children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
