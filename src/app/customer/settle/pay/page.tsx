
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

type ShopDues = {
  shopId: string;
  shopName: string;
  shopAddress: string;
  totalDue: number;
  upiId?: string;
};

function SettlePayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAppContext();
  
  const [upiLink, setUpiLink] = useState('');

  const shop: ShopDues | null = useMemo(() => {
    const shopDataString = searchParams.get('shop');
    if (!shopDataString) return null;
    try {
      return JSON.parse(decodeURIComponent(shopDataString));
    } catch {
      return null;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && (!user || !shop)) {
      router.push('/customer/history');
    }
    if (shop?.upiId && shop.totalDue > 0) {
      const note = encodeURIComponent(`Payment for Udhaar to ${shop.shopName}`);
      const link = `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.shopName)}&am=${shop.totalDue.toFixed(2)}&cu=INR&tn=${note}`;
      setUpiLink(link);
    }
  }, [user, shop, router, isLoading]);

  
  if (isLoading || !user || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
           <div className="flex items-center gap-4 mb-4">
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                 <ArrowLeft size={16}/>
            </Button>
            <CardTitle className="font-headline text-3xl text-center flex-1">Pay with UPI</CardTitle>
            <div className="w-8"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paying to</p>
              <p className="text-xl font-semibold">{shop.shopName}</p>
              <p className="text-xs text-muted-foreground">{shop.shopAddress}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-headline text-5xl font-bold text-primary">₹{shop.totalDue.toFixed(2)}</p>
            </div>
          </div>
          
          {!shop.upiId ? (
             <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
                <p className='font-bold'>Payment Unavailable</p>
                <p className="text-sm">This shopkeeper has not set up their UPI ID for payments.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Click the button below to pay using your UPI app.</p>
                
                <Button asChild className="w-full" size="lg">
                  <Link href={upiLink}>
                    <Wallet className="mr-2"/> Pay ₹{shop.totalDue.toFixed(2)} Now
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground px-4">
                  After paying, your dues will be settled automatically once the shopkeeper confirms the payment.
                </p>
               <Button onClick={() => router.push('/customer/history')} className="w-full" variant="outline">
                    Back to My Udhaar
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettlePayPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SettlePayPageContent />
        </Suspense>
    )
}
