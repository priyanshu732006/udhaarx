
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
  setUser: (user: User) => Promise<void>;
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

  // Listener for auth state changes from Firebase
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
        // User logged out
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

  // Listener for user data and transactions once we have a firebaseUser
  useEffect(() => {
    if (!db || !firebaseUser) {
      // If no user, stop loading and clear data
      if (!firebaseUser) {
          setIsLoading(false);
          setUserState(null);
          setTransactions([]);
      }
      return;
    }

    // We have a firebaseUser, now listen to their document in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
        setRoleState(storedRole);

        if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUserState(userData);
        } else {
            // User is authenticated, but we don't have their details in Firestore yet.
            // This is fine, the details page will call `setUser` to create it.
            setUserState(null);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching user document:", error);
        setIsLoading(false);
    });

    return () => unsubscribeUser();
  }, [firebaseUser]);

  // Separate listener for transactions that depends on user and role
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

  }, [user, role])


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
        // Use the user's firebase UID as the document ID
        await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
        setUserState(newUser);
      } catch (error) {
        console.error("Error saving user to Firestore:", error);
        throw error;
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
      // The 'return' here is crucial for the promise chain on the confirm page.
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
