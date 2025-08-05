
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BookOpenCheck, LogOut, Camera, Wallet, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc, getDoc } from 'firebase/firestore';

type DuesByShop = {
  shopId: string;
  shopName: string;
  shopAddress: string;
  totalDue: number;
  transactionCount: number;
  upiId?: string;
};

export default function CustomerHistoryPage() {
  const { user, transactions, isLoading } = useAppContext();
  const router = useRouter();
  const [duesByShop, setDuesByShop] = useState<DuesByShop[]>([]);
  const [isDuesLoading, setIsDuesLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/customer/details');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const processDues = async () => {
      if (isLoading || !transactions) return;

      const unsettledTxs = transactions.filter(tx => !tx.settled);
      if (unsettledTxs.length === 0) {
        setDuesByShop([]);
        setIsDuesLoading(false);
        return;
      }
      
      const groups: { [key: string]: DuesByShop } = {};
      for (const tx of unsettledTxs) {
        if (!tx.shopId) continue;
        if (!groups[tx.shopId]) {
          groups[tx.shopId] = {
            shopId: tx.shopId,
            shopName: tx.shopName,
            shopAddress: tx.shopAddress || 'N/A',
            totalDue: 0,
            transactionCount: 0,
          };
        }
        groups[tx.shopId].totalDue += tx.amount || 0;
        groups[tx.shopId].transactionCount += 1;
      }
      
      const duesWithUpi = await Promise.all(
        Object.values(groups).map(async (shop) => {
          try {
            const shopDoc = await getDoc(doc(db, 'users', shop.shopId));
            if(shopDoc.exists()){
              const shopData = shopDoc.data();
              return { ...shop, upiId: shopData.upiId };
            }
          } catch (e) {
            console.error("Could not fetch shop details for UPI ID", e);
          }
          return shop;
        })
      );
      
      setDuesByShop(Object.values(duesWithUpi).sort((a, b) => b.totalDue - a.totalDue));
      setIsDuesLoading(false);
    };

    processDues();
  }, [transactions, isLoading]);

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    router.push('/');
  };

  const handlePayNow = (shop: DuesByShop) => {
    const encodedShopData = encodeURIComponent(JSON.stringify(shop));
    router.push(`/customer/settle?shop=${encodedShopData}`);
  };

  const { totalUdhaar } = useMemo(() => {
    const total = duesByShop.reduce((acc, curr) => acc + curr.totalDue, 0);
    return { totalUdhaar: total };
  }, [duesByShop]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
            <p className="text-muted-foreground">Hi {user.name}, here's your udhaar summary.</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <p className="text-muted-foreground">Total Pending</p>
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
              <Wallet />
              Outstanding Dues
            </CardTitle>
            <CardDescription>Select a shop to settle your outstanding udhaar.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDuesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : duesByShop.length > 0 ? (
              <div className="space-y-4">
                {duesByShop.map(shop => (
                  <Card key={shop.shopId} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{shop.shopName}</h3>
                        <p className="text-sm text-muted-foreground">{shop.shopAddress}</p>
                        <p className="text-sm text-muted-foreground">{shop.transactionCount} pending transaction(s)</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-headline text-2xl font-bold text-primary">₹{shop.totalDue.toFixed(2)}</p>
                        <Button size="sm" onClick={() => handlePayNow(shop)} disabled={!shop.upiId}>
                           Pay Now
                        </Button>
                        {!shop.upiId && <p className="text-xs text-destructive mt-1">Payments disabled</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>You have no outstanding dues. Great job!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <h2 className="font-headline text-2xl flex items-center gap-2">
                <BookOpenCheck />
                Full Transaction History
              </h2>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardDescription>All your recorded udhaar transactions. Settled dues are greyed out.</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Shop Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx: Transaction) => (
                            <TableRow key={tx.id} className={cn(tx.settled && "text-muted-foreground opacity-60")}>
                              <TableCell className="font-medium">{tx.shopName}</TableCell>
                              <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right font-medium">₹{(tx.amount || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{tx.settled ? 'Settled' : 'Pending'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>You have no udhaar records yet. Scan a shop's QR code to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
