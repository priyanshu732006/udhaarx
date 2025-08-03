
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, User, Store, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Separator } from '@/components/ui/separator';

type ShopData = {
  id: string;
  name: string;
};

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, addTransaction, isLoading } = useAppContext();
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shop = useMemo(() => {
    const shopDataString = searchParams.get('shop');
    if (!shopDataString) return null;
    try {
      return JSON.parse(decodeURIComponent(shopDataString)) as ShopData;
    } catch {
      return null;
    }
  }, [searchParams]);

  const amount = useMemo(() => {
    return parseFloat(searchParams.get('amount') || '0');
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/customer/details');
      if (!shop || !amount) router.push('/customer/scan');
    }
  }, [user, shop, amount, router, isLoading]);

  const handleConfirm = async () => {
    if (user && shop && amount) {
      setIsSubmitting(true);
      try {
        await addTransaction({
          customerId: user.id,
          customerName: user.name,
          customerMobile: user.mobile || 'N/A',
          shopId: shop.id,
          shopName: shop.name,
          amount: amount,
        });
        setIsConfirmed(true);
      } catch (error) {
        console.error("Failed to add transaction", error);
        // Optionally show a toast message on error
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading || !user || !shop || !amount) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSubmitting) {
     return (
      <div className="flex min-h-screen flex-col gap-4 items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Saving your udhaar...</p>
      </div>
    );
  }
  
  if (isConfirmed) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-green-100 p-4 rounded-full w-fit">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <CardTitle className="font-headline text-3xl mt-4">Udhaar Recorded!</CardTitle>
                <CardDescription>Your transaction of ₹{amount.toFixed(2)} with {shop.name} has been successfully saved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button onClick={() => router.push('/customer/history')} className="w-full">
                    View My Udhaar
                </Button>
                <Button onClick={() => router.push('/customer/scan')} className="w-full" variant="outline">
                    Record Another Udhaar
                </Button>
            </CardContent>
        </Card>
       </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Confirm Transaction</CardTitle>
          <CardDescription>Please review the details below before confirming.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-headline text-5xl font-bold text-primary">₹{amount.toFixed(2)}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><User size={16}/> From</span>
                <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Store size={16}/> To</span>
                <span className="font-semibold">{shop.name}</span>
            </div>
          </div>
          
          <Button onClick={handleConfirm} className="w-full" disabled={isSubmitting}>
            Confirm and Save Udhaar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
