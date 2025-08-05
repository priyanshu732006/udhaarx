
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export const dynamic = 'force-dynamic';

type ShopData = {
  id: string;
  name: string;
  address: string;
};

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0.' }).multipleOf(0.01),
});

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<ShopData | null>(null);
  const { user, isLoading } = useAppContext();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
    const shopDataString = searchParams.get('shop');
    if (shopDataString) {
      try {
        setShop(JSON.parse(decodeURIComponent(shopDataString)));
      } catch (error) {
        console.error('Failed to parse shop data', error);
        router.push('/customer/scan');
      }
    } else if (!isLoading) {
       router.push('/customer/scan');
    }
  }, [searchParams, router, user, isLoading]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const encodedShopData = searchParams.get('shop');
    router.push(`/customer/confirm?shop=${encodedShopData}&amount=${values.amount}`);
  }

  if (isLoading || !shop) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Enter Udhaar Amount</CardTitle>
          <CardDescription>
            Paying to <span className="font-semibold text-primary">{shop.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₹</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="text-4xl h-20 pl-10 pr-4 text-center font-headline"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Proceed to Confirm
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
