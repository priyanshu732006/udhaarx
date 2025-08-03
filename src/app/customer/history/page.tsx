'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BookOpenCheck } from 'lucide-react';

export default function CustomerHistoryPage() {
  const { user, transactions, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  const customerTransactions = transactions.filter(t => t.customerId === user.id);
  const totalUdhaar = customerTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <div>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">My Udhaar</h1>
                <p className="text-muted-foreground">Hi {user.name}, here's your transaction history.</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-muted-foreground">Total Udhaar</p>
            <p className="font-headline text-3xl font-bold text-primary">₹{totalUdhaar.toFixed(2)}</p>
        </div>
      </header>

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
    </div>
  );
}
