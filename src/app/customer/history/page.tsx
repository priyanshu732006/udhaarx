
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BookOpenCheck, LogOut, Camera, Wallet } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function CustomerHistoryPage() {
  const { user, transactions, isLoading } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

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

  const { unsettledTransactions, totalUdhaar } = useMemo(() => {
    const unsettled = transactions.filter(tx => !tx.settled);
    const total = unsettled.reduce((acc, curr) => acc + curr.amount, 0);
    return { unsettledTransactions: unsettled, totalUdhaar: total };
  }, [transactions]);
  
  const hasUnsettledDues = unsettledTransactions.length > 0;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
            <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <BookOpenCheck />
                    Transaction History
                </CardTitle>
                {hasUnsettledDues && (
                     <Button onClick={() => router.push('/customer/settle')}>
                        <Wallet className="mr-2"/> Settle Dues
                    </Button>
                )}
            </div>
            <CardDescription>All your recorded udhaar transactions. Settled dues are greyed out.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Shop Address</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: Transaction) => (
                      <TableRow key={tx.id} className={cn(tx.settled && "text-muted-foreground opacity-60")}>
                        <TableCell className="font-medium">{tx.shopName}</TableCell>
                        <TableCell>{tx.shopAddress || 'N/A'}</TableCell>
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
                <Camera />
                Record a New Udhaar
            </CardTitle>
             <CardDescription>Quickly scan another shop's QR code to record a new transaction.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             <Button onClick={() => router.push('/customer/scan')}>
                <Camera className="mr-2"/> Scan QR Code
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
