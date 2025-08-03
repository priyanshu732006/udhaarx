'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useEffect, useState } from 'react';

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { setRole, setUser, isLoading, user: appContextUser } = useAppContext();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && appContextUser && !isSigningIn) {
      router.push('/customer/scan');
    }
  }, [isLoading, appContextUser, isSigningIn, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const customerData = {
        id: user.uid,
        name: user.displayName || 'Customer',
        email: user.email,
        mobile: user.phoneNumber || ''
      };
      setUser(customerData);
      setRole('customer');
      router.push('/customer/scan');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setIsSigningIn(false);
    }
  };
  
  if (isLoading || (appContextUser && !isSigningIn)) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Customer Login</CardTitle>
          <CardDescription>Sign in to manage your Udhaar.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn}>
                {isSigningIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.7-37.9-96.6-37.9-84.9 0-153.2 68.3-153.2 153.2s68.3 153.2 153.2 153.2c97.1 0 134.1-65.1 140.1-95.3H248v-73.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                )}
                {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
                {!isSigningIn && <ArrowRight className="ml-2" />}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
