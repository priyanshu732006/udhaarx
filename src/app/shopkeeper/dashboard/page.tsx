
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, LogOut, Download, Loader2, Users } from 'lucide-react';
import { auth } from '@/lib/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';

type GroupedTransactions = {
  [customerId: string]: {
    customerName: string;
    customerMobile: string;
    transactions: Transaction[];
    totalAmount: number;
  };
};

export default function ShopkeeperDashboard() {
  const { user, transactions, isLoading } = useAppContext();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/shopkeeper/details');
    } else if (user) {
      const shopData = JSON.stringify({ id: user.id, name: user.name, address: user.address });
      const encodedData = encodeURIComponent(shopData);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}&qzone=2&format=png`);
    }
  }, [user, isLoading, router]);
  
  const groupedTransactions = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      // Defensively check for customerId to prevent crashes on bad data
      if (!tx.customerId) {
        return acc;
      }
      if (!acc[tx.customerId]) {
        acc[tx.customerId] = {
          customerName: tx.customerName || 'Unknown Customer',
          customerMobile: tx.customerMobile || 'N/A',
          transactions: [],
          totalAmount: 0,
        };
      }
      acc[tx.customerId].transactions.push(tx);
      acc[tx.customerId].totalAmount += tx.amount;
      return acc;
    }, {} as GroupedTransactions);
  }, [transactions]);
  
  const customerCount = Object.keys(groupedTransactions).length;

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const totalUdhaar = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-start sm:items-center mb-8 flex-col sm:flex-row gap-4">
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
              <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                <div>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2"><Users/> Customer Dues</CardTitle>
                  <CardDescription>
                    You have {transactions.length} total transaction(s) from {customerCount} customer(s).
                  </CardDescription>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-muted-foreground">Total Udhaar</p>
                    <p className="font-headline text-3xl font-bold text-primary">₹{totalUdhaar.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(groupedTransactions).map(([customerId, data]) => (
                    <AccordionItem value={customerId} key={customerId}>
                      <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                        <div className="flex justify-between items-center w-full">
                           <div className='text-left'>
                                <p className="font-semibold text-base">{data.customerName}</p>
                                <p className="text-sm text-muted-foreground">{data.customerMobile}</p>
                           </div>
                           <div className='text-right'>
                               <p className="font-headline text-lg font-bold text-primary mr-4">₹{data.totalAmount.toFixed(2)}</p>
                               <Badge variant="secondary">{data.transactions.length} transaction(s)</Badge>
                           </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-2">
                         <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.transactions.map((tx: Transaction) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">{tx.customerId}</TableCell>
                                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-medium">₹{tx.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
