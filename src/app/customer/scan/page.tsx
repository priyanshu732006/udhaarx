
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult, Html5QrcodeScannerState } from 'html5-qrcode';
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
  
  // Use a ref for the scanner instance to avoid re-renders triggering effects
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  const onScanSuccess = useCallback((decodedText: string, result: Html5QrcodeResult) => {
    // Stop the scanner and then process the result
    if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
      html5QrCodeRef.current.stop().then(() => {
        try {
          const parsedData = JSON.parse(decodedText);
          if (typeof parsedData !== 'object' || parsedData === null || !parsedData.id || !parsedData.name) {
              throw new Error("QR code does not contain valid shop data.");
          }
          setScanMessage('QR Code detected! Redirecting...');
          const encodedShopData = encodeURIComponent(decodedText);
          router.push(`/customer/pay?shop=${encodedShopData}`);
        } catch (e) {
          console.error("Invalid QR code format", e);
          toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "This QR code is not compatible. Please scan a valid UdhaarX QR code.",
          });
          // Optionally restart scanning after a delay
        }
      }).catch(err => console.error("Failed to stop QR scanner", err));
    }
  }, [router, toast]);
  
  const onScanFailure = useCallback((error: Html5QrcodeError) => {
    // This is called frequently for non-scans, so we can ignore it to prevent log spam.
  }, []);

  useEffect(() => {
    if (isLoading || !user || typeof window === 'undefined') {
      return;
    }

    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_ID, false);
    }
    const html5QrCode = html5QrCodeRef.current;
    
    const startScanner = () => {
        if(html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
            return;
        }
        html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdge * 0.7);
                return { width: qrboxSize, height: qrboxSize };
              },
              aspectRatio: 1.0,
            },
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error("Error starting scanner:", err);
            setHasCameraPermission(false);
        });
    }

    const requestCameraAndStart = async () => {
        try {
            await Html5Qrcode.getCameras();
            setHasCameraPermission(true);
            startScanner();
        } catch (err: any) {
            console.error("Camera permission error:", err);
            setHasCameraPermission(false);
            const errName = err ? err.name : 'UnknownError';
            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings to scan a QR code.',
                    duration: 5000,
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Camera Error',
                    description: `Could not initialize camera. ${err.message || 'Please ensure you have a camera connected.'}`,
                    duration: 5000,
                });
            }
        }
    };
    
    requestCameraAndStart();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(error => console.info("QR scanner failed to stop on unmount.", error));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

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
          <div className="w-full rounded-lg overflow-hidden aspect-square bg-gray-800 flex items-center justify-center">
            <div id={QR_SCANNER_ID} className="w-full h-full" />
            {hasCameraPermission === null && <p className="text-gray-400 -mt-12">Initializing camera...</p> }
          </div>
           {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4 bg-red-900/50 border-red-500/50 text-white">
                  <AlertTitle>Camera Access Problem</AlertTitle>
                  <AlertDescription>
                      Could not access the camera. Please ensure it's not in use and that you have granted permission in your browser settings.
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
