
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';

type ShopDues = {
  shopId: string;
  shopName: string;
  shopAddress: string;
  totalDue: number;
  upiId?: string;
};

export default function SettleDuesPage() {
  const { user, isLoading } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  }, [user, isLoading, router, shop]);

  const handlePayNow = () => {
    if (!shop) return;
    const encodedShopData = encodeURIComponent(JSON.stringify(shop));
    router.push(`/customer/settle/pay?shop=${encodedShopData}`);
  };

  if (isLoading || !user || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
              <ArrowLeft size={16}/>
            </Button>
            <CardTitle className="font-headline text-3xl text-center flex-1">Settle Due</CardTitle>
            <div className="w-8"></div>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                You are about to pay your outstanding udhaar to:
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-bold text-2xl text-primary">{shop.shopName}</p>
                <p className="text-muted-foreground">{shop.shopAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount Due</p>
                <p className="font-headline text-5xl font-bold">₹{shop.totalDue.toFixed(2)}</p>
              </div>
          </div>
          <Button onClick={handlePayNow} className="w-full" disabled={!shop.upiId}>
            <Wallet className="mr-2"/> Proceed to Pay
          </Button>
          {!shop.upiId && <p className="text-sm text-destructive mt-1">This shop has not enabled online payments.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
