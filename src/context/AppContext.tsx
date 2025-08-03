
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type User = {
  id: string; // This will be the Firebase UID
  name: string; // displayName from Firebase
  email: string | null;
  mobile?: string;
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
  firebaseUser: FirebaseUser | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<'customer' | 'shopkeeper' | null>(null);
  const [user, setUserState] = useState<User>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(() => {
    try {
        const storedTransactions = JSON.parse(localStorage.getItem('udhaarx-transactions') || '[]');
        setTransactions(storedTransactions);
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        setTransactions([]);
      }
  }, []);

  // Effect to listen for changes in localStorage from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'udhaarx-transactions') {
        loadTransactions();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTransactions]);


  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
        setIsLoading(false);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);
      setFirebaseUser(currentUser);
      if (currentUser) {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        const storedUser = JSON.parse(localStorage.getItem('udhaarx-user') || 'null');
        setRoleState(storedRole);
        if (storedUser && storedUser.id === currentUser.uid) {
            setUserState(storedUser);
        } else {
            // This case might be hit if a user is authenticated but their details aren't in localStorage.
            // We should probably guide them to the details page. For now, we create a minimal user.
             const newUser: User = {
                id: currentUser.uid,
                name: currentUser.displayName || 'Anonymous',
                email: currentUser.email
            };
             setUserState(newUser);
        }
      } else {
        setUserState(null);
        setRoleState(null);
        localStorage.removeItem('udhaarx-user');
        localStorage.removeItem('udhaarx-role');
      }
      loadTransactions();
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadTransactions]);

  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('udhaarx-role', newRole);
    } else {
      localStorage.removeItem('udhaarx-role');
    }
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('udhaarx-user', JSON.stringify(newUser));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const currentTransactions = JSON.parse(localStorage.getItem('udhaarx-transactions') || '[]');
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString(),
    };
    const updatedTransactions = [...currentTransactions, newTransaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('udhaarx-transactions', JSON.stringify(updatedTransactions));
  };

  const value = {
    role,
    setRole,
    user,
    setUser,
    transactions,
    addTransaction,
    isLoading,
    firebaseUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
