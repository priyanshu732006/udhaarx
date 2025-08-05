
'use client';

import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';

export default function ShopkeeperProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAppContext();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/shopkeeper/details');
    }
  }, [user, isLoading, router]);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
              <ArrowLeft size={16}/>
            </Button>
            <CardTitle className="font-headline text-3xl text-center flex-1">Shop Profile</CardTitle>
            <div className="w-8"></div>
          </div>
          <CardDescription className="text-center">Your shop details are safe with us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Shop Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Shop Address</span>
              <span className="font-semibold">{user.address}</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Owner's Email</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Mobile</span>
              <span className="font-semibold">{user.mobile || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">UPI ID</span>
              <span className="font-semibold">{user.upiId || 'Not Provided'}</span>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full" disabled={!auth}>
            <LogOut className="mr-2 h-4 w-4"/> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
