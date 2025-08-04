
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type ShopDues = {
  shopId: string;
  shopName: string;
  shopAddress: string;
  totalDue: number;
  upiId?: string;
};

export default function SettlePayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAppContext();
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
      const upiLink = `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.shopName)}&am=${shop.totalDue.toFixed(2)}&cu=INR&tn=${note}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&qzone=2&format=png`);
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
          
          <Separator />

          {!shop.upiId ? (
             <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
                <p className='font-bold'>Payment Unavailable</p>
                <p className="text-sm">This shopkeeper has not set up their UPI ID for payments.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">Scan the QR code with your UPI app to pay.</p>
                <div className="flex justify-center">
                    {qrCodeUrl ? (
                         <div className="p-4 border rounded-lg bg-white">
                            <Image src={qrCodeUrl} alt="UPI Payment QR Code" width={250} height={250} data-ai-hint="qr code"/>
                        </div>
                    ) : (
                        <div className="w-[250px] h-[250px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                </div>
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
