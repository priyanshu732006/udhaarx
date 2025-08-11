
'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentHandlerProps {
  upiId?: string;
  amount: number;
  payeeName: string;
}

export function PaymentHandler({ upiId, amount, payeeName }: PaymentHandlerProps) {
  const [upiLink, setUpiLink] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, ensuring window object is available
    setIsClient(true);

    if (upiId && amount > 0) {
      const note = encodeURIComponent(`Udhaar payment to ${payeeName}`);
      const encodedPayeeName = encodeURIComponent(payeeName);
      const link = `upi://pay?pa=${upiId}&pn=${encodedPayeeName}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;
      setUpiLink(link);
    }
  }, [upiId, amount, payeeName]);

  // On the server, or before the client-side effect runs, render a loader.
  if (!isClient) {
    return (
        <div className="space-y-4 text-center">
            <Skeleton className="h-12 w-full" />
            <div className="flex flex-col items-center gap-2 pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-[200px] w-[200px] rounded-lg" />
            </div>
        </div>
    );
  }

  // On the client, render the actual content
  if (upiId && upiLink) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Click the button below to pay with your favorite UPI app, or scan the QR code.</p>
        
        <a 
          href={upiLink} 
          className={cn(buttonVariants({ size: 'lg' }), "w-full")}
        >
          <Wallet className="mr-2"/> Pay ₹{amount.toFixed(2)} Now
        </a>

        <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-xs text-muted-foreground">Or Scan QR Code</p>
            <div className="p-4 bg-white rounded-lg border">
               <QRCodeCanvas value={upiLink} size={200} />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
       <p className='font-bold'>Payment Unavailable</p>
       <p className="text-sm">This shopkeeper has not set up their UPI ID for payments.</p>
   </div>
  );
}
