'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Store, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function Home() {
  const { setRole } = useAppContext();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary">UdhaarX</h1>
        <p className="text-muted-foreground mt-2 text-lg">Your Digital Udhaar Khata</p>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <User className="w-8 h-8 text-primary" />
              <span className="font-headline text-2xl">Customer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Manage your credit with local shops. Scan QR codes to easily record your transactions.
            </p>
            <Link href="/customer/details" passHref>
              <Button className="w-full" onClick={() => setRole('customer')}>
                I am a Customer <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Store className="w-8 h-8 text-primary" />
              <span className="font-headline text-2xl">Shopkeeper</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Track customer credit effortlessly. Generate your unique QR code for quick payments.
            </p>
            <Link href="/shopkeeper/details" passHref>
              <Button className="w-full" onClick={() => setRole('shopkeeper')}>
                I am a Shopkeeper <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <footer className="text-center mt-12 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} UdhaarX. All rights reserved.</p>
      </footer>
    </main>
  );
}
