
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      setFirebaseUser(currentUser);
      if (currentUser) {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        setRoleState(storedRole);
        
        // Fetch user data from Firestore to ensure it's up to date
        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserState(userDoc.data() as User);
          } else {
             // This case is for when a user signs in for the first time
             // The details pages should handle creating this doc
             const newUser: User = {
                id: currentUser.uid,
                name: currentUser.displayName || 'Anonymous',
                email: currentUser.email
            };
            setUserState(newUser)
          }
        }
        
      } else {
        setUserState(null);
        setRoleState(null);
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
        return () => {}; // Return an empty function for cleanup
    }

    const transactionsCol = collection(db, 'transactions');
    let q;
    
    // Determine the query based on the user's role
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
    // Also save/update the user in Firestore
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
      // Return the promise from addDoc
      return await addDoc(collection(db, 'transactions'), {
        ...transaction,
        date: Timestamp.now(), 
      }).then(() => {}); // Ensure it resolves to void
    } catch (e) {
      console.error("Error adding document: ", e);
      // Re-throw the error so it can be caught by the caller
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
