
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, setDoc } from 'firebase/firestore';

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
      } else {
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

  // User and transaction data listener
  useEffect(() => {
    if (!db) return;

    let unsubscribeUser: () => void = () => {};
    let unsubscribeTransactions: () => void = () => {};

    if (firebaseUser) {
      // Listen to user document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        setRoleState(storedRole);

        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUserState(userData);

          // Once we have the user and role, listen to transactions
          if (storedRole && userData) {
            const transactionsCol = collection(db, 'transactions');
            const field = storedRole === 'customer' ? 'customerId' : 'shopId';
            const q = query(transactionsCol, where(field, '==', userData.id), orderBy('date', 'desc'));

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
          }
        } else {
            // User exists in auth, but not in our 'users' collection yet.
            // The details page should create this doc via setUser.
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

    } else {
      // No firebaseUser, ensure everything is cleared
      setUserState(null);
      setTransactions([]);
    }
    
    // Cleanup listeners on unmount or when firebaseUser changes
    return () => {
      unsubscribeUser();
      unsubscribeTransactions();
    };
  }, [firebaseUser]);

  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('udhaarx-role', newRole);
    } else {
      localStorage.removeItem('udhaarx-role');
    }
  };

  const setUser = async (newUser: User) => {
    // This function is for CREATING/UPDATING the user doc in firestore
    if (newUser && db) {
       try {
        await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
        setUserState(newUser); // also update local state
       } catch (error) {
        console.error("Error saving user to Firestore:", error);
       }
    } else {
      setUserState(null);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<void> => {
    if (!db) {
      console.error("Firestore not initialized");
      throw new Error("Firestore not initialized");
    }
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        date: Timestamp.now(), 
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e; // Re-throw the error to be caught by the caller
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
