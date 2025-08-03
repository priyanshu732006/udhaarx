
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';

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
      if (!currentUser) {
        setUserState(null);
        setRoleState(null);
        localStorage.removeItem('udhaarx-role');
        setTransactions([]);
        setIsLoading(false);
      }
      // The user data fetching is now handled in the next useEffect
    });

    return () => unsubscribeAuth();
  }, []);
  
  // Effect for fetching/listening to user data
  useEffect(() => {
    if (!db || !firebaseUser) {
        setIsLoading(false);
        return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        setRoleState(storedRole);
        if (userDoc.exists()) {
            setUserState(userDoc.data() as User);
        } else {
            // This case is for when a user signs in for the first time
            // The details pages should handle creating this doc
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Anonymous',
                email: firebaseUser.email
            };
            setUserState(newUser)
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error listening to user document:", error);
        setIsLoading(false);
    });
    
    return () => unsubscribeUser();

  }, [firebaseUser])

  // Effect for fetching/listening to transactions
  useEffect(() => {
    if (!db || !user || !role) {
        setTransactions([]);
        return () => {}; // Return an empty function for cleanup
    }

    const transactionsCol = collection(db, 'transactions');
    let q;
    
    const field = role === 'customer' ? 'customerId' : 'shopId';
    q = query(transactionsCol, where(field, '==', user.id), orderBy('date', 'desc'));

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribeFirestore(); // Cleanup the listener

  }, [user, role]);


  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('udhaarx-role', newRole);
    } else {
      localStorage.removeItem('udhaarx-role');
    }
  };

  const setUser = async (newUser: User) => {
    setUserState(newUser);
    if (newUser && db) {
       try {
        await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
       } catch (error) {
        console.error("Error saving user to Firestore:", error);
       }
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!db) {
      console.error("Firestore not initialized");
      throw new Error("Firestore not initialized");
    }
    try {
      return await addDoc(collection(db, 'transactions'), {
        ...transaction,
        date: Timestamp.now(), 
      }).then(() => {});
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
