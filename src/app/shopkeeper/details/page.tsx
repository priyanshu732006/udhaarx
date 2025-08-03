
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Store, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Shop name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
});

type ShopkeeperDetails = z.infer<typeof formSchema>;

export default function ShopkeeperDetailsPage() {
  const router = useRouter();
  const { setUser, setRole, isLoading, user: appContextUser } = useAppContext();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [shopkeeperDetails, setShopkeeperDetails] = useState<ShopkeeperDetails | null>(null);

  const form = useForm<ShopkeeperDetails>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      mobile: '',
    },
  });

  const handleDetailsSubmit = (values: ShopkeeperDetails) => {
    setShopkeeperDetails(values);
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider || !shopkeeperDetails) return;
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const shopkeeperData = {
        id: user.uid,
        name: shopkeeperDetails.name,
        email: user.email,
        address: shopkeeperDetails.address,
        mobile: shopkeeperDetails.mobile, // Ensure mobile is saved
      };
      await setUser(shopkeeperData);
      setRole('shopkeeper');
      router.push('/shopkeeper/dashboard');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setIsSigningIn(false);
    }
  };
  
  const handleProceed = () => {
    setRole('shopkeeper');
    router.push('/shopkeeper/dashboard');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (appContextUser && !isSigningIn) {
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
                    <Button onClick={handleProceed} className="w-full">
                        <LogIn className="mr-2"/> Proceed to Dashboard
                    </Button>
                    <Button onClick={() => auth.signOut()} className="w-full" variant="outline">
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
          <CardTitle className="font-headline text-3xl mt-4">Shopkeeper Details</CardTitle>
          <CardDescription>
            {shopkeeperDetails ? 'Sign in to save your shop details.' : 'First, provide your shop details.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!shopkeeperDetails ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4">
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
                      <FormLabel>Your Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Save and Proceed <ArrowRight className="ml-2" />
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
               <div className="rounded-md border p-4 text-sm">
                    <p><strong>Shop Name:</strong> {shopkeeperDetails.name}</p>
                    <p><strong>Address:</strong> {shopkeeperDetails.address}</p>
                    <p><strong>Mobile:</strong> {shopkeeperDetails.mobile}</p>
               </div>
               <Button onClick={handleGoogleSignIn} className="w-full" disabled={isSigningIn || !auth}>
                {isSigningIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                   <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.7-37.9-96.6-37.9-84.9 0-153.2 68.3-153.2 153.2s68.3 153.2 153.2 153.2c97.1 0 134.1-65.1 140.1-95.3H248v-73.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                )}
                {isSigningIn ? 'Signing In...' : 'Sign in with Google to Continue'}
              </Button>
               <Button variant="outline" onClick={() => setShopkeeperDetails(null)} className="w-full">
                Edit Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
