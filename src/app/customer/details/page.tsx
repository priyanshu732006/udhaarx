'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { User, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobile: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }).optional(),
});

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser, setRole } = useAppContext();
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      mobile: '',
      otp: '',
    },
  });

  const handleSendOtp = async () => {
    const mobile = form.getValues('mobile');
    const isMobileValid = await form.trigger('mobile');
    if (!isMobileValid) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpSent(true);

    console.log(`OTP for ${mobile} is: ${otp} (This is for testing)`);
    toast({
      title: 'OTP Sent!',
      description: `We've sent an OTP to ${mobile}. (Check your browser's developer console).`,
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.otp !== generatedOtp) {
      form.setError('otp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
      return;
    }
    
    const customerId = `cust_${Math.random().toString(36).substring(2, 9)}`;
    setUser({ ...values, id: customerId });
    setRole('customer');
    router.push('/customer/scan');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Customer Details</CardTitle>
          <CardDescription>Enter your details to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ramesh Kumar" {...field} disabled={otpSent}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <div className="flex gap-2">
                       <FormControl>
                        <Input type="tel" placeholder="10-digit mobile number" {...field} disabled={otpSent}/>
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleSendOtp} disabled={otpSent}>
                        {otpSent ? 'Sent' : 'Send OTP'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {otpSent && (
                 <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter OTP</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="6-digit OTP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {otpSent ? (
                <Button type="submit" className="w-full">
                  <ShieldCheck className="mr-2" /> Verify & Proceed
                </Button>
              ) : (
                 <Button type="button" className="w-full" disabled>
                  Proceed
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
