
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
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isDataLoading, setDataLoading] = useState(true);

  // Listener for auth state changes from Firebase
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
      setRoleState(storedRole);
      
      if (!currentFirebaseUser) {
        // Logged out
        setUserState(null);
        setRoleState(null);
        localStorage.removeItem('udhaarx-role');
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);
  
  // Listener for user data from firestore, dependent on firebaseUser
  useEffect(() => {
      if(!firebaseUser) {
          setDataLoading(false);
          return;
      }
      
      setDataLoading(true);
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
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
          setUserState(null);
        }
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching user document:", error);
        setDataLoading(false);
      });

      return () => unsubscribeUser();
  }, [firebaseUser]);

  // Listener for transactions that depends on user and role
  useEffect(() => {
      if (!db || !user || !role) {
          setTransactions([]);
          return;
      }
      
      const transactionsCol = collection(db, 'transactions');
      const field = role === 'customer' ? 'customerId' : 'shopId';
      
      const q = query(transactionsCol, where(field, '==', user.id), orderBy('date', 'desc'));

      const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
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

      return () => unsubscribeTransactions();

  }, [user, role]);
  
  // Combined loading state
  useEffect(() => {
    setIsLoading(isAuthLoading || isDataLoading);
  }, [isAuthLoading, isDataLoading]);


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
