
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, LogOut, Download } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function ShopkeeperDashboard() {
  const { user, transactions, isLoading, setRole, setUser } = useAppContext();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [shopTransactions, setShopTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/shopkeeper/details');
    } else if (user) {
      const shopData = JSON.stringify({ id: user.id, name: user.name, address: user.address });
      const encodedData = encodeURIComponent(shopData);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}&qzone=2&format=png`);
      
      const filteredTransactions = transactions.filter(t => t.shopId === user.id);
      setShopTransactions(filteredTransactions);
    }
  }, [user, isLoading, router, transactions]);

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    // AppContext will handle cleanup
    router.push('/');
  };

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  const totalUdhaar = shopTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Shopkeeper Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user.name}!</p>
        </div>
        <Button variant="outline" onClick={handleLogout} disabled={!auth}>
          <LogOut className="mr-2 h-4 w-4"/> Logout
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-8">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <QrCode className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl mt-4">Your Shop QR Code</CardTitle>
              <CardDescription>Customers can scan this to record udhaar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrCodeUrl ? (
                <div className="p-4 border rounded-lg bg-white">
                  <Image src={qrCodeUrl} alt="Shop QR Code" width={250} height={250} data-ai-hint="qr code"/>
                </div>
              ) : (
                <div className="w-[250px] h-[250px] bg-gray-200 animate-pulse rounded-lg"></div>
              )}
              <a href={qrCodeUrl} download={`${user.name}-QR.png`}>
                <Button variant="secondary" className="w-full">
                  <Download className="mr-2 h-4 w-4"/> Download QR
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg">
             <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
                  <CardDescription>
                    You have {shopTransactions.length} transaction(s) from your customers.
                  </CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">Total Udhaar</p>
                    <p className="font-headline text-3xl font-bold text-primary">₹{totalUdhaar.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shopTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Customer ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopTransactions.map((tx: Transaction) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.customerName}</TableCell>
                        <TableCell>{tx.customerMobile}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{tx.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{tx.customerId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No transactions yet.</p>
                  <p>Ask a customer to scan your QR code to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
