
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Store, ArrowRight, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Shop name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
  upiId: z.string().min(3, { message: 'Please enter a valid UPI ID.' }).regex(/@/, { message: 'Please enter a valid UPI ID.'}),
});

type ShopkeeperDetails = z.infer<typeof formSchema>;


export default function ShopkeeperDetailsPage() {
  const router = useRouter();
  const { setRole, setUser, isLoading, user } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    setRole('shopkeeper');
    if (!isLoading && user) {
        router.push('/shopkeeper/dashboard');
    }
  }, [user, isLoading, router, setRole]);


  const form = useForm<ShopkeeperDetails>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      mobile: '',
      upiId: '',
    },
  });


  const handleDetailsSubmit = async (values: ShopkeeperDetails) => {
    if (!auth || !googleProvider) return;
    
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const shopkeeperData = {
        id: firebaseUser.uid,
        name: values.name,
        email: firebaseUser.email,
        address: values.address,
        mobile: values.mobile,
        upiId: values.upiId,
      };
      await setUser(shopkeeperData);
      // The useEffect will handle the redirect
    } catch (error) {
      console.error("Sign-in or data save error:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Shopkeeper Details</CardTitle>
          <CardDescription>Enter your shop details, then sign in with Google to continue.</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <FormLabel>UPI ID for Payments</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. yourname@okicici" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting || !auth}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.7-37.9-96.6-37.9-84.9 0-153.2 68.3-153.2 153.2s68.3 153.2 153.2 153.2c97.1 0 134.1-65.1 140.1-95.3H248v-73.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                    )}
                    {isSubmitting ? 'Saving...' : 'Save and Continue with Google'}
                    <ArrowRight className="ml-2" />
                </Button>
              </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
