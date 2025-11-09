
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);

    if (userId.toLowerCase() !== 'rohitverma' || password !== 'verma@99') {
      toast({
        variant: 'destructive',
        title: 'Invalid Credentials',
        description: 'Please check your UserID and Password.',
      });
      setLoading(false);
      return;
    }
    
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Authentication not ready',
            description: 'Please wait a moment and try again.',
        });
        setLoading(false);
        return;
    }

    try {
      // Attempt to sign in as the owner
      await signInWithEmailAndPassword(auth, 'rohitvetma101010@gmail.com', 'verma@99');
      toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
      router.push('/');
    } catch (error: any) {
      // If the owner account doesn't exist, create it and then sign in.
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, 'rohitvetma101010@gmail.com', 'verma@99');
           // After creation, sign in is automatic via onAuthStateChanged, so we just redirect.
          toast({ title: 'Owner Account Created', description: 'Redirecting to your dashboard...' });
          router.push('/');
        } catch (creationError: any) {
          toast({
            variant: 'destructive',
            title: 'Account Creation Failed',
            description: creationError.message,
          });
        }
      } else {
        // Handle other sign-in errors
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">UserID</Label>
            <Input 
                id="userId" 
                placeholder="rohitverma" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin()}}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin()}}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
