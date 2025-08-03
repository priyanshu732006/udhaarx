
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BookOpenCheck, LogOut, Camera, QrCode } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QR_SCANNER_ID = "qr-scanner-region-history";

export default function CustomerHistoryPage() {
  const { user, transactions, isLoading } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    router.push('/');
  };

  const onScanSuccess = useCallback((decodedText: string, result: Html5QrcodeResult) => {
    if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScannerVisible(false);
        try {
          const parsedData = JSON.parse(decodedText);
          if (typeof parsedData !== 'object' || parsedData === null || !parsedData.id || !parsedData.name) {
            throw new Error("QR code does not contain valid shop data.");
          }
          const encodedShopData = encodeURIComponent(decodedText);
          router.push(`/customer/pay?shop=${encodedShopData}`);
        } catch (e) {
          console.error("Invalid QR code format", e);
          toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "This QR code is not compatible. Please scan a valid UdhaarX QR code.",
          });
        }
      }).catch(err => console.error("Failed to stop QR scanner", err));
    }
  }, [router, toast]);

  const onScanFailure = useCallback((error: Html5QrcodeError) => {
    // Ignore, this is called frequently
  }, []);

  const startScanner = useCallback(() => {
    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_ID, false);
    }
    const html5QrCode = html5QrCodeRef.current;
    
    const start = () => {
        if(html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
            return;
        }
        html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdge * 0.8);
                return { width: qrboxSize, height: qrboxSize };
              },
            },
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error("Error starting scanner:", err);
            setHasCameraPermission(false);
        });
    }

    Html5Qrcode.getCameras().then(() => {
      setHasCameraPermission(true);
      start();
    }).catch(err => {
      console.error("Camera permission error:", err);
      setHasCameraPermission(false);
      toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to scan a QR code.',
          duration: 5000,
      });
    });
  }, [onScanSuccess, onScanFailure, toast]);

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(error => console.info("QR scanner failed to stop.", error));
    }
  };

  useEffect(() => {
    if (isScannerVisible) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScannerVisible, startScanner]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  const customerTransactions = transactions.filter(t => t.customerId === user.id);
  const totalUdhaar = customerTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/customer/scan')}>
                <ArrowLeft />
            </Button>
            <div>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">My Udhaar</h1>
                <p className="text-muted-foreground">Hi {user.name}, here's your transaction history.</p>
            </div>
        </div>
        <div className="flex flex-col items-end gap-4">
            <div className="text-right">
                <p className="text-muted-foreground">Total Udhaar</p>
                <p className="font-headline text-3xl font-bold text-primary">₹{totalUdhaar.toFixed(2)}</p>
            </div>
             <Button variant="outline" onClick={handleLogout} disabled={!auth}>
              <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
        </div>
      </header>

      <main className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <BookOpenCheck />
              Transaction History
            </CardTitle>
            <CardDescription>All your recorded udhaar transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {customerTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerTransactions.map((tx: Transaction) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.shopName}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{tx.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>You have no udhaar records yet.</p>
                <p>Scan a shop's QR code to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <QrCode />
                Record a New Udhaar
            </CardTitle>
             <CardDescription>Quickly scan another shop's QR code to record a new transaction.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {!isScannerVisible ? (
                 <Button onClick={() => setIsScannerVisible(true)}>
                    <Camera className="mr-2"/> Scan QR Code
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-xs rounded-lg overflow-hidden aspect-square bg-slate-100 flex items-center justify-center">
                      <div id={QR_SCANNER_ID} className="w-full h-full" />
                       {hasCameraPermission === null && <p className="text-gray-500">Initializing camera...</p> }
                    </div>
                     {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Problem</AlertTitle>
                            <AlertDescription>
                                Could not access the camera. Please grant permission in your browser.
                            </AlertDescription>
                        </Alert>
                     )}
                    <Button variant="outline" onClick={() => setIsScannerVisible(false)}>
                        Cancel
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
