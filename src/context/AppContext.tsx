
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, setDoc, getDoc, writeBatch, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

export type User = {
  id: string; // This will be the Firebase UID
  name: string;
  email: string | null;
  mobile?: string;
  address?: string;
  upiId?: string;
  authorizedViewers?: string[];
} | null;

export type Transaction = {
  id:string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  amount: number;
  date: string; // Storing as ISO string
  settled?: boolean;
};

type AppContextType = {
  role: 'customer' | 'shopkeeper' | null;
  setRole: (role: 'customer' | 'shopkeeper' | null) => void;
  user: User;
  setUser: (user: Omit<User, 'authorizedViewers'>) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<any>;
  settleTransactions: (shopId: string) => Promise<void>;
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
  
  // Fetch user data when firebaseUser changes
  useEffect(() => {
    if (firebaseUser) {
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
            upiId: data.upiId,
            authorizedViewers: data.authorizedViewers || [],
          };
          setUserState(userData);
          const storedRole = localStorage.getItem('udhaarx-role') as 'customer' | 'shopkeeper' | null;
          setRoleState(storedRole);
        } else {
           // User doc doesn't exist yet, will be created on details page submission
           setUserState(null);
        }
        // Loading is handled by transaction listener
      }, (error) => {
        console.error("Error fetching user document:", error);
        setIsLoading(false);
      });
      return () => unsubscribeUser();
    }
  }, [firebaseUser]);
  
  
  // Transaction listener, depends on firebaseUser AND role
  useEffect(() => {
    // Only proceed if we have a logged-in user and a selected role
    if (!firebaseUser || !role) {
      setTransactions([]); // Clear transactions if no user or role
      if(!firebaseUser) setIsLoading(false); // Stop loading if user logged out
      return;
    }

    setIsLoading(true);

    const transactionsCol = collection(db, 'transactions');
    const fieldToQuery = role === 'customer' ? 'customerId' : 'shopId';
    const q = query(transactionsCol, where(fieldToQuery, '==', firebaseUser.uid));

    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const newTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate().toISOString(),
        } as Transaction;
      });
      newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(newTransactions);
      setIsLoading(false);
    }, (error) => {
      console.error(`Error fetching transactions for role ${role}:`, error);
      setIsLoading(false);
    });

    // Cleanup function to unsubscribe from the listener
    return () => {
      unsubscribeTransactions();
    };
  }, [firebaseUser, role]); // Rerun this effect if firebaseUser or role changes


  const setRole = (newRole: 'customer' | 'shopkeeper' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('udhaarx-role', newRole);
    } else {
      localStorage.removeItem('udhaarx-role');
    }
  };

  const setUser = async (newUser: Omit<User, 'authorizedViewers'>) => {
     if (newUser && db) {
      try {
        const userRef = doc(db, "users", newUser.id);
        // Use set with merge to create or update the user document
        await setDoc(userRef, newUser, { merge: true });
      } catch (error) {
        console.error("Error saving user to Firestore:", error);
        throw error;
      }
    } else {
      setUserState(null);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!db || !user) {
      console.error("Firestore not initialized or user not logged in");
      throw new Error("Firestore not initialized or user not logged in");
    }
    try {
      const batch = writeBatch(db);

      // 1. Create new transaction document
      const newTransactionRef = doc(collection(db, 'transactions'));
      batch.set(newTransactionRef, {
        ...transaction,
        date: Timestamp.now(),
        settled: false,
      });

      // 2. Add shopkeeper's ID to the customer's authorizedViewers list
      const customerRef = doc(db, "users", transaction.customerId);
      batch.set(customerRef, {
          authorizedViewers: arrayUnion(transaction.shopId)
      }, { merge: true });
      
      // 3. Add customer's ID to the shopkeeper's authorizedViewers list
      const shopkeeperRef = doc(db, "users", transaction.shopId);
      batch.set(shopkeeperRef, {
          authorizedViewers: arrayUnion(transaction.customerId)
      }, { merge: true });

      await batch.commit();
      
      return newTransactionRef;

    } catch (e) {
      console.error("Error adding document and updating user: ", e);
      throw e;
    }
  };

  const settleTransactions = async (shopId: string) => {
    if (!user || !db) {
      console.error("User not logged in or DB not initialized");
      throw new Error("User not logged in or DB not initialized");
    }

    const transactionsCol = collection(db, 'transactions');
    const q = query(
      transactionsCol, 
      where('customerId', '==', user.id),
      where('shopId', '==', shopId),
      where('settled', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No unsettled transactions to settle for this shop.");
      return;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { settled: true });
    });

    await batch.commit();
  };


  const value = {
    role,
    setRole,
    user,
    setUser,
    transactions,
    addTransaction,
    settleTransactions,
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
