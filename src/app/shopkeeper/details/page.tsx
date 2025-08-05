
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Store, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doc, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Shop name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
  upiId: z.string().min(3, { message: 'Please enter a valid UPI ID.' }).regex(/@/, { message: 'Please enter a valid UPI ID.'}),
});

type ShopkeeperDetails = z.infer<typeof formSchema>;

export default function ShopkeeperDetailsPage() {
  const router = useRouter();
  const { setRole, setUser, isLoading: isAppContextLoading, user: appContextUser, firebaseUser, setFirebaseUser } = useAppContext();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  const form = useForm<ShopkeeperDetails>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      mobile: '',
      upiId: '',
    },
  });

  const checkUserAndRedirect = useCallback(async (fbUser: FirebaseUser) => {
    if (!db) return;
    setIsCheckingUser(true);
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      router.push('/shopkeeper/dashboard');
    } else {
      setShowDetailsForm(true);
    }
    setIsCheckingUser(false);
  }, [router]);

  useEffect(() => {
    setRole('shopkeeper');
    if (!isAppContextLoading) {
      if (firebaseUser) {
        checkUserAndRedirect(firebaseUser);
      } else {
        setIsCheckingUser(false);
      }
    }
  }, [firebaseUser, isAppContextLoading, checkUserAndRedirect, setRole]);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state change will be caught by useEffect
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDetailsSubmit = async (values: ShopkeeperDetails) => {
    if (!firebaseUser) return;
    
    setIsSigningIn(true);
    try {
      const shopkeeperData = {
        id: firebaseUser.uid,
        name: values.name,
        email: firebaseUser.email,
        address: values.address,
        mobile: values.mobile,
        upiId: values.upiId,
      };
      await setUser(shopkeeperData);
      router.push('/shopkeeper/dashboard');
    } catch (error) {
      console.error("Failed to save shopkeeper details", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isAppContextLoading || isCheckingUser) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (firebaseUser && appContextUser && !showDetailsForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl mt-4">Welcome Back, {appContextUser.name}!</CardTitle>
            <CardDescription>You are already signed in. You can proceed to your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.push('/shopkeeper/dashboard')} className="w-full">
              <LogIn className="mr-2"/> Proceed to Dashboard
            </Button>
            <Button onClick={async () => {
              if (auth) await auth.signOut();
              setFirebaseUser(null);
              setShowDetailsForm(false);
            }} className="w-full" variant="outline">
              Sign in with a different account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">
            {showDetailsForm ? 'Your Shop Details' : 'Shopkeeper Sign In'}
          </CardTitle>
          <CardDescription>
            {showDetailsForm ? 'Please provide your shop details to continue.' : 'Sign in with Google to manage your shop.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showDetailsForm && firebaseUser ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <div className="rounded-md border p-4 text-sm bg-muted/50">
                    <p><strong>Email:</strong> {firebaseUser.email}</p>
                    <p className='text-xs text-muted-foreground'>To change this, sign in with a different Google account.</p>
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kirana Store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 123 Main St, New Delhi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. yourname@okicici" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save and Continue'}
                  <ArrowRight className="ml-2" />
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn || !auth}>
                {isSigningIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                   <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.7-37.9-96.6-37.9-84.9 0-153.2 68.3-153.2 153.2s68.3 153.2 153.2 153.2c97.1 0 134.1-65.1 140.1-95.3H248v-73.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                )}
                {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
