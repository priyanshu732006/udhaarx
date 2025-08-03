'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QR_SCANNER_ID = "qr-scanner";

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useAppContext();
  const [scanMessage, setScanMessage] = useState('Position QR code in the frame...');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if(isLoading || !user || typeof window === 'undefined') return;

    const qrScanner = new Html5QrcodeScanner(
      QR_SCANNER_ID,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      try {
        JSON.parse(decodedText);
        setScanMessage('QR Code detected! Redirecting...');
        const encodedShopData = encodeURIComponent(decodedText);
        router.push(`/customer/pay?shop=${encodedShopData}`);
        qrScanner.clear().catch(error => console.error("Failed to clear scanner", error));
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "The scanned QR code is not valid for UdhaarX.",
        });
      }
    };

    const onScanFailure = (error: any) => {
      // Continuous scanning, so ignore non-match errors.
      // We can add more specific error handling here if needed.
    };
    
    qrScanner.render(onScanSuccess, onScanFailure)
      .then(() => setHasCameraPermission(true))
      .catch(err => {
        console.error("Camera permission error", err)
        setHasCameraPermission(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings to scan a QR code.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Could not initialize the camera. Please check if another app is using it.',
            });
        }
      });
      

    return () => {
      // cleanup function to clear the scanner on component unmount
      if (document.getElementById(QR_SCANNER_ID)) {
          qrScanner.clear().catch(error => console.error("Failed to clear scanner on unmount", error));
      }
    };
  }, [user, isLoading, router, toast]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-sm bg-black/50 border-gray-700 text-white">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                <Camera className="w-8 h-8 text-primary"/>
            </div>
          <CardTitle className="font-headline text-3xl mt-4 text-white">Scan & Pay</CardTitle>
          <CardDescription className="text-gray-300">{scanMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div id={QR_SCANNER_ID} className="w-full rounded-lg overflow-hidden"></div>
           {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4 bg-red-900/50 border-red-500/50 text-white">
                  <AlertTitle>Camera Access Denied</AlertTitle>
                  <AlertDescription>
                      Please enable camera permissions in your browser settings to scan a QR code.
                  </AlertDescription>
              </Alert>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
