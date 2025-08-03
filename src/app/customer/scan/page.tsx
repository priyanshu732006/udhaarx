
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { Camera, BookOpenCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const QR_SCANNER_ID = "qr-scanner-region";

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useAppContext();
  const [scanMessage, setScanMessage] = useState('Position QR code in the frame...');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  const onScanSuccess = useCallback((decodedText: string, result: Html5QrcodeResult) => {
    if (qrScannerRef.current?.isScanning) {
      qrScannerRef.current.stop().catch(err => console.error("Failed to stop QR scanner", err));
    }
    try {
      // Validate that the decoded text is a valid JSON object
      JSON.parse(decodedText); 
      setScanMessage('QR Code detected! Redirecting...');
      const encodedShopData = encodeURIComponent(decodedText);
      router.push(`/customer/pay?shop=${encodedShopData}`);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Invalid QR Code",
        description: "The scanned QR code is not valid for UdhaarX.",
      });
      // Optionally restart the scanner
    }
  }, [router, toast]);
  
  const onScanFailure = useCallback((error: Html5QrcodeError) => {
    // This is called frequently. We can add logic here if needed, but for now, we'll ignore it to prevent spamming logs/toasts.
  }, []);

  // Initialize and start the scanner
  useEffect(() => {
    if (isLoading || !user || typeof window === 'undefined' || qrScannerRef.current) {
      return;
    }

    const html5QrCode = new Html5Qrcode(QR_SCANNER_ID);
    qrScannerRef.current = html5QrCode;
    
    const startScanner = async () => {
      try {
        await Html5Qrcode.getCameras();
        setHasCameraPermission(true);
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          onScanFailure
        ).catch(err => {
          console.error("Error starting scanner:", err);
          setHasCameraPermission(false);
        });
      } catch (err: any) {
        console.error("Camera permission error:", err);
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
                description: 'Could not initialize the camera. It might be in use by another application.',
            });
        }
      }
    };
    
    startScanner();

    // Cleanup on component unmount
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(error => console.info("QR scanner failed to stop on unmount.", error));
      }
      qrScannerRef.current = null;
    };
  }, [user, isLoading, onScanSuccess, onScanFailure, toast]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
       <Card className="w-full max-w-sm bg-black/50 border-gray-700 text-white">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                <Camera className="w-8 h-8 text-primary"/>
            </div>
          <CardTitle className="font-headline text-3xl mt-4 text-white">Scan & Pay</CardTitle>
          <CardDescription className="text-gray-300">{scanMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div id={QR_SCANNER_ID} className="w-full rounded-lg overflow-hidden aspect-square bg-gray-800 flex items-center justify-center">
            {hasCameraPermission === null && <p className="text-gray-400">Initializing camera...</p> }
          </div>
           {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4 bg-red-900/50 border-red-500/50 text-white">
                  <AlertTitle>Camera Access Problem</AlertTitle>
                  <AlertDescription>
                      Could not access the camera. Please ensure it is not in use by another app and that you have granted permissions in your browser settings.
                  </AlertDescription>
              </Alert>
           )}
        </CardContent>
      </Card>
      <Button 
        variant="outline" 
        className="mt-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
        onClick={() => router.push('/customer/history')}>
        <BookOpenCheck className="mr-2"/> View My Udhaar
      </Button>
    </div>
  );
}
