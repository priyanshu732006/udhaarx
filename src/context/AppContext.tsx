'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);
      setFirebaseUser(currentUser);
      if (currentUser) {
        // User is signed in.
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        const storedUser = JSON.parse(localStorage.getItem('udhaarx-user') || 'null');

        setRoleState(storedRole);

        // If we have a stored user matching the firebase UID, use it.
        if (storedUser && storedUser.id === currentUser.uid) {
            setUserState(storedUser);
        } else {
            // Otherwise, create a user object from firebase data
            const newUser: User = {
                id: currentUser.uid,
                name: currentUser.displayName || 'New User',
                email: currentUser.email
            };
            setUserState(newUser);
            localStorage.setItem('udhaarx-user', JSON.stringify(newUser));
        }

      } else {
        // User is signed out.
        setUserState(null);
        setRoleState(null);
        localStorage.removeItem('udhaarx-user');
        localStorage.removeItem('udhaarx-role');
      }

      // Load transactions regardless of login state
      try {
        const storedTransactions = JSON.parse(localStorage.getItem('udhaarx-transactions') || '[]');
        if (storedTransactions) setTransactions(storedTransactions);
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
