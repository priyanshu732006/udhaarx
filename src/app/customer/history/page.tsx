
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Transaction } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BookOpenCheck, LogOut, Camera, Wallet, Loader2, User, FileDown } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  
  const handleDownloadPDF = async (shop: DuesByShop) => {
    const unsettledTxs = transactions.filter(tx => !tx.settled && tx.shopId === shop.shopId);
    
    const invoiceElement = document.createElement('div');
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.width = '800px';
    invoiceElement.style.padding = '20px';
    invoiceElement.style.fontFamily = 'sans-serif';
     invoiceElement.innerHTML = `
      <div style="border: 1px solid #eee; padding: 20px; font-family: sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 0;">Udhaar Statement</h1>
        <p style="font-size: 14px; color: #666;">Generated on: ${new Date().toLocaleDateString()}</p>
        <hr style="margin: 20px 0;" />
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 16px; margin-bottom: 5px;">Shop Details</h2>
            <p style="margin: 0;">${shop.shopName}</p>
            <p style="margin: 0;">${shop.shopAddress}</p>
          </div>
          <div>
            <h2 style="font-size: 16px; margin-bottom: 5px;">Customer Details</h2>
            <p style="margin: 0;">${user?.name}</p>
            <p style="margin: 0;">${user?.mobile}</p>
          </div>
        </div>
        <h2 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Pending Transactions</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
              <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${unsettledTxs.map(tx => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(tx.date).toLocaleDateString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${tx.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total Due</td>
              <td style="padding: 8px; font-weight: bold; text-align: right;">₹${shop.totalDue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    document.body.appendChild(invoiceElement);
    
    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`udhaar-statement-${shop.shopName.replace(/\s/g, '-')}.pdf`);
    
    document.body.removeChild(invoiceElement);
  };


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
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-muted-foreground">Total Pending</p>
            <p className="font-headline text-3xl font-bold text-primary">₹{totalUdhaar.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/customer/profile')}>
              <User className="mr-2 h-4 w-4"/> My Profile
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={!auth}>
              <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
          </div>
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
                        <div className="flex gap-2">
                           <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(shop)}>
                               <FileDown className="mr-2 h-4 w-4"/> PDF
                           </Button>
                           <Button size="sm" onClick={() => handlePayNow(shop)} disabled={!shop.upiId}>
                               Pay Now
                           </Button>
                        </div>
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
