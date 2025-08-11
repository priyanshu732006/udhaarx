
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';


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
          
          {!shop.upiId || !upiLink ? (
             <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
                <p className='font-bold'>Payment Unavailable</p>
                <p className="text-sm">This shopkeeper has not set up their UPI ID for payments.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Click the button below to pay with your favorite UPI app, or scan the QR code.</p>
                
                <a 
                  href={upiLink} 
                  className={cn(buttonVariants({ size: 'lg' }), "w-full")}
                >
                  <Wallet className="mr-2"/> Pay ₹{shop.totalDue.toFixed(2)} Now
                </a>

                <div className="flex flex-col items-center gap-2 pt-4">
                    <p className="text-xs text-muted-foreground">Or Scan QR Code</p>
                    <div className="p-4 bg-white rounded-lg border">
                       <QRCodeCanvas value={upiLink} size={200} />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground px-4 pt-4">
                  After paying, ask the shopkeeper to mark your udhaar as settled. This will be an automatic process in a future update.
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
