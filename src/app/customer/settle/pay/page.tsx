
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
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
  const { user, settleTransactions, isLoading } = useAppContext();
  const { toast } = useToast();
  
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const note = encodeURIComponent(`Payment for UdhaarX`);
      const link = `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.shopName)}&am=${shop.totalDue.toFixed(2)}&cu=INR&tn=${note}`;
      setUpiLink(link);
    }
  }, [user, shop, router, isLoading]);

  const handleConfirmPayment = () => {
    if (!user || !shop) return;
    setIsSubmitting(true);
    settleTransactions(shop.shopId).then(() => {
      setPaymentConfirmed(true);
      setIsSubmitting(false);
    }).catch(error => {
      console.error("Failed to settle transactions", error);
      toast({
        variant: "destructive",
        title: "Confirmation Failed",
        description: "Could not confirm your payment. Please try again.",
        duration: 9000
      });
      setIsSubmitting(false); 
    });
  };
  
  if (isLoading || !user || !shop) {
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
        <p className="text-muted-foreground">Confirming payment...</p>
      </div>
    );
  }
  
  if (paymentConfirmed) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-green-100 p-4 rounded-full w-fit">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <CardTitle className="font-headline text-3xl mt-4">Payment Confirmed!</CardTitle>
                <CardDescription>Your payment of ₹{shop.totalDue.toFixed(2)} to {shop.shopName} has been successfully recorded.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button onClick={() => router.push('/customer/history')} className="w-full">
                    View My Udhaar
                </Button>
            </CardContent>
        </Card>
       </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                 <ArrowLeft size={16}/>
            </Button>
            <div className='flex items-center gap-2'>
                <Image src="https://placehold.co/100x100.png" data-ai-hint="payment logo" alt="UPI" width={32} height={32} />
                <span className="font-semibold">UPI Payment</span>
            </div>
             <div className="w-8"></div>
          </div>
          <CardTitle className="font-headline text-3xl text-center">Pay Shopkeeper</CardTitle>
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
            <div className="space-y-4">
              <a href={upiLink} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full h-12 text-lg">
                    Open UPI App to Pay <ExternalLink className="ml-2"/>
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center px-4">
                After completing the payment in your UPI app, come back and click the button below to confirm.
              </p>
              <Button onClick={handleConfirmPayment} className="w-full" variant="outline" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'I Have Completed the Payment'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
