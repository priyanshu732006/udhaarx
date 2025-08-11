
'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet, Smartphone, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


type PaymentQRCodeProps = {
  upiLink: string;
  amount: number;
};

export function PaymentQRCode({ upiLink, amount }: PaymentQRCodeProps) {
  const isMobile = useIsMobile();
  
  // Render a loading state until the hook has determined if it's mobile or not.
  if (isMobile === undefined) {
    return (
       <div className="flex flex-col items-center gap-4 justify-center h-64">
         <Loader2 className="w-8 h-8 animate-spin" />
         <p className="text-sm text-muted-foreground">Loading payment options...</p>
       </div>
    )
  }

  return (
    <div className="space-y-4">
      {isMobile ? (
        <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Click the button to pay with your UPI app</p>
            <Button asChild className="w-full" size="lg">
                <Link href={upiLink}>
                    <Wallet className="mr-2"/> Pay ₹{amount.toFixed(2)} Now
                </Link>
            </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Scan this QR code with your UPI app</p>
            <div className="p-4 bg-white rounded-lg border">
                <QRCodeCanvas value={upiLink} size={220} />
            </div>
        </div>
      )}
    </div>
  );
}
