
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function LoginPage() {
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    timePassword: '',
  });
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleOwnerLogin = async () => {
    setLoading(true);
    const now = new Date();
    const expectedPassword = format(now, 'HHmm');

    if (formState.timePassword !== expectedPassword) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Time Password',
        description: 'The password does not match the current time.',
      });
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, 'rohitvetma101010@gmail.com', 'verma@99');
      toast({ title: 'Owner Login Successful', description: 'Redirecting to your dashboard...' });
      router.push('/admin');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, 'rohitvetma101010@gmail.com', 'verma@99');
          toast({ title: 'Owner Account Created', description: 'Please log in again to access the dashboard.' });
        } catch (creationError: any) {
          toast({
            variant: 'destructive',
            title: 'Owner Creation Failed',
            description: creationError.message,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Owner Login Failed',
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = async (action: 'login' | 'signup') => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication not ready',
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setLoading(true);

    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, formState.email, formState.password);
      } else {
        await createUserWithEmailAndPassword(auth, formState.email, formState.password);
      }
      toast({ title: action === 'login' ? 'Login Successful' : 'Signup Successful', description: 'Redirecting...' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="user" className="w-[450px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="owner">Owner</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up / Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>User Login</CardTitle>
                  <CardDescription>Enter your UserID (email) and password to access your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">UserID (Email)</Label>
                    <Input id="email" type="email" placeholder="m@example.com" value={formState.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formState.password} onChange={handleInputChange} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleAuthAction('login')} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create a new account to request access from the owner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">UserID (Email)</Label>
                    <Input id="email" type="email" placeholder="m@example.com" value={formState.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formState.password} onChange={handleInputChange} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleAuthAction('signup')} disabled={loading}>
                    {loading ? 'Registering...' : 'Register & Request Access'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="owner">
          <Card>
            <CardHeader>
              <CardTitle>Owner Panel Access</CardTitle>
              <CardDescription>Enter the time-based password to access the owner control panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timePassword">Time Password (HHmm)</Label>
                <Input 
                  id="timePassword" 
                  type="password" 
                  placeholder="e.g., 1430"
                  value={formState.timePassword}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOwnerLogin()}}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleOwnerLogin} disabled={loading}>
                {loading ? 'Authenticating...' : 'Enter Control Panel'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
