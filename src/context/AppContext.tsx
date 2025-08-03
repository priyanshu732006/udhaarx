
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';

type User = {
  id: string; // This will be the Firebase UID
  name: string;
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
  setUser: (user: User) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<any>;
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

  // Auth state listener
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setIsLoading(true);
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        setRoleState(storedRole);
      } else {
        // Logged out
        setFirebaseUser(null);
        setUserState(null);
        setRoleState(null);
        setTransactions([]);
        localStorage.removeItem('udhaarx-role');
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // User data and transaction listener
  useEffect(() => {
    let unsubscribeUser: () => void;
    let unsubscribeTransactions: () => void;

    if (firebaseUser) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userData: User = {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            address: data.address,
          };
          setUserState(userData);
        } else {
          // This can happen briefly during signup before the user doc is created
          setUserState(null); 
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching user document:", error);
        setIsLoading(false);
      });
    }

    if (user && role) {
      const transactionsCol = collection(db, 'transactions');
      const field = role === 'customer' ? 'customerId' : 'shopId';
      const q = query(transactionsCol, where(field, '==', user.id), orderBy('date', 'desc'));

      unsubscribeTransactions = onSnapshot(q, (snapshot) => {
        const newTransactions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate().toISOString(),
          } as Transaction;
        });
        setTransactions(newTransactions);
      }, (error) => {
        console.error("Error fetching transactions:", error);
      });
    } else {
      setTransactions([]);
    }

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [firebaseUser, user?.id, role]);


  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('udhaarx-role', newRole);
    } else {
      localStorage.removeItem('udhaarx-role');
    }
  };

  const setUser = async (newUser: User) => {
    if (newUser && db) {
      try {
        // Use the user's UID as the document ID
        await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
        // The onSnapshot listener will automatically update the state
      } catch (error) {
        console.error("Error saving user to Firestore:", error);
        throw error;
      }
    } else {
      setUserState(null);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!db) {
      console.error("Firestore not initialized");
      throw new Error("Firestore not initialized");
    }
    try {
      return addDoc(collection(db, 'transactions'), {
        ...transaction,
        date: Timestamp.now(),
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
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
