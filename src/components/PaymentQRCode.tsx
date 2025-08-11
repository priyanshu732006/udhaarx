
'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


type PaymentQRCodeProps = {
  upiLink: string;
  amount: number;
};

export function PaymentQRCode({ upiLink, amount }: PaymentQRCodeProps) {
  const isMobile = useIsMobile();
  const [showQrCode, setShowQrCode] = useState(false);
  
  // By default, on mobile we show the button, on desktop the QR.
  // We use useEffect to set the initial state to avoid hydration mismatches.
  useEffect(() => {
    setShowQrCode(!isMobile);
  }, [isMobile]);

  return (
    <div className="space-y-4">
      {showQrCode ? (
        <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Scan this QR code with your UPI app</p>
            <div className="p-4 bg-white rounded-lg border">
                <QRCodeCanvas value={upiLink} size={220} />
            </div>
             {isMobile && (
                <Button variant="link" onClick={() => setShowQrCode(false)}>
                    <Wallet className="mr-2"/> Or Pay Directly
                </Button>
            )}
        </div>
      ) : (
         <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Click the button to pay with your UPI app</p>
            <Button asChild className="w-full" size="lg">
                <Link href={upiLink}>
                    <Wallet className="mr-2"/> Pay ₹{amount.toFixed(2)} Now
                </Link>
            </Button>
             {!isMobile && (
                <Button variant="link" onClick={() => setShowQrCode(true)}>
                    <Smartphone className="mr-2"/> Or Show QR Code
                </Button>
            )}
        </div>
      )}
    </div>
  );
}
