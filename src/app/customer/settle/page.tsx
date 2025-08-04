
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction, User } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type DuesByShop = {
  shopId: string;
  shopName: string;
  shopAddress: string;
  totalDue: number;
  transactionCount: number;
  upiId?: string;
};

export default function SettleDuesPage() {
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
      if (transactions.length === 0) {
          setDuesByShop([]);
          setIsDuesLoading(false);
          return;
      }

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
        groups[tx.shopId].totalDue += tx.amount;
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
      
      setDuesByShop(duesWithUpi);
      setIsDuesLoading(false);
    };

    if (!isLoading) {
      processDues();
    }
  }, [transactions, isLoading]);
  
  const handleSelectShop = (shop: DuesByShop) => {
     const encodedShopData = encodeURIComponent(JSON.stringify(shop));
     router.push(`/customer/settle/pay?shop=${encodedShopData}`);
  }

  if (isLoading || isDuesLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isDuesLoading && duesByShop.length === 0) {
      return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
             <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => router.push('/customer/history')}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">All Dues Settled</h1>
                </div>
            </header>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">You have no outstanding udhaar to settle. Great job!</p>

                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex items-center gap-4 mb-8">
         <Button variant="outline" size="icon" onClick={() => router.push('/customer/history')}>
            <ArrowLeft />
        </Button>
        <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Settle Dues</h1>
            <p className="text-muted-foreground">Select a shop to pay your outstanding udhaar.</p>
        </div>
      </header>

      <main className="space-y-4">
        {duesByShop.map(shop => (
           <Card key={shop.shopId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-lg">{shop.shopName}</h2>
                        <p className="text-sm text-muted-foreground">{shop.shopAddress}</p>
                        <p className="text-sm text-muted-foreground">{shop.transactionCount} transaction(s)</p>
                    </div>
                    <div className="text-right">
                        <p className="font-headline text-2xl font-bold text-primary">₹{shop.totalDue.toFixed(2)}</p>
                        <Button size="sm" className="mt-2" onClick={() => handleSelectShop(shop)} disabled={!shop.upiId}>
                           Pay Now
                        </Button>
                        {!shop.upiId && <p className="text-xs text-destructive mt-1">Payments disabled</p>}
                    </div>
                </CardContent>
           </Card>
        ))}
      </main>
    </div>
  );
}
