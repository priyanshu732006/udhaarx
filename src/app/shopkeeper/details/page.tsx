'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Store, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Shop name must be at least 2 characters.' }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
});

export default function ShopkeeperDetailsPage() {
  const router = useRouter();
  const { setUser, setRole } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      mobile: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const shopId = `shop_${Math.random().toString(36).substring(2, 9)}`;
    setUser({ ...values, id: shopId });
    setRole('shopkeeper');
    router.push('/shopkeeper/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Shopkeeper Details</CardTitle>
          <CardDescription>Enter your shop details to generate your QR code.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Gupta General Store" {...field} />
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
                      <Textarea placeholder="Enter your full shop address" {...field} />
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
                      <Input type="tel" placeholder="10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Generate QR Code <ArrowRight className="ml-2" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
