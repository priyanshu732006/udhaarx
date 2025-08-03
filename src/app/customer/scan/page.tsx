'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';

export default function ScanPage() {
  const router = useRouter();
  const { user, isLoading } = useAppContext();
  const [scanMessage, setScanMessage] = useState('Position QR code in the frame...');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);
  
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setScanMessage('QR Code detected! Redirecting...');
        // Mocking a scanned QR code
        const mockShopData = {
          id: 'shop_gstore123',
          name: 'Gupta General Store',
          address: '123, Sadar Bazaar, Delhi',
        };
        const encodedShopData = encodeURIComponent(JSON.stringify(mockShopData));
        router.push(`/customer/pay?shop=${encodedShopData}`);
      }, 3000); // 3-second delay to simulate scanning

      return () => clearTimeout(timer);
    }
  }, [router, user]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <style jsx>{`
        .scanner-box {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          overflow: hidden;
          border-radius: 1rem;
        }
        .scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: hsl(var(--primary));
          box-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary));
          animation: scan 3s linear infinite;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
      <Card className="w-full max-w-sm bg-black/50 border-gray-700 text-white">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                <Camera className="w-8 h-8 text-primary"/>
            </div>
          <CardTitle className="font-headline text-3xl mt-4 text-white">Scan & Pay</CardTitle>
          <CardDescription className="text-gray-300">{scanMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="scanner-box bg-gray-800">
             <div className="scan-line"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
