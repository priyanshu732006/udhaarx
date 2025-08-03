
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

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
  date: string; // Storing as ISO string
};

type AppContextType = {
  role: 'customer' | 'shopkeeper' | null;
  setRole: (role: 'customer' | 'shopkeeper' | null) => void;
  user: User;
  setUser: (user: User) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
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
    if (typeof window === 'undefined' || !auth) {
        setIsLoading(false);
        return;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);
      setFirebaseUser(currentUser);
      if (currentUser) {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        const storedUser = JSON.parse(localStorage.getItem('udhaarx-user') || 'null');
        setRoleState(storedRole);
        if (storedUser && storedUser.id === currentUser.uid) {
            setUserState(storedUser);
        } else {
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
        setTransactions([]); // Clear transactions on logout
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (!db || !user || !role) {
        setTransactions([]);
        return;
    }

    const transactionsCol = collection(db, 'transactions');
    let q;
    
    if (role === 'customer') {
        q = query(transactionsCol, where('customerId', '==', user.id), orderBy('date', 'desc'));
    } else { // shopkeeper
        q = query(transactionsCol, where('shopId', '==', user.id), orderBy('date', 'desc'));
    }

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const newTransactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to ISO string for consistency
                date: (data.date as Timestamp).toDate().toISOString(),
            } as Transaction;
        });
        setTransactions(newTransactions);
    }, (error) => {
        console.error("Error fetching transactions:", error);
    });

    return () => unsubscribeFirestore();

  }, [user, role]);


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
    if (newUser) {
      localStorage.setItem('udhaarx-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('udhaarx-user');
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!db) {
        console.error("Firestore not initialized");
        return;
    }
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        date: new Date(), // Use Firestore server timestamp
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
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
