
'use client';

import { useState } from 'react';
import { useFirestore, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AccessRequest, UserRole } from '@/lib/types';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccessRequestPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [requestedRole, setRequestedRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);

  const requestRef = user && firestore ? doc(collection(firestore, 'access_requests'), user.uid) : null;
  const { data: existingRequest, isLoading } = useDoc<AccessRequest>(requestRef);

  const handleRequestAccess = async () => {
    if (!user || !user.email || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to request access.',
      });
      return;
    }
    if (existingRequest && existingRequest.status === 'pending') {
        toast({
            title: 'Request already pending',
            description: 'You already have an access request pending approval.'
        });
        return;
    }

    setLoading(true);
    const newRequest: Omit<AccessRequest, 'id'> = {
      userId: user.uid,
      email: user.email,
      requestedRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      if (requestRef) {
        await setDoc(requestRef, newRequest);
        toast({
          title: 'Request Sent',
          description: `Your request for ${requestedRole} access has been sent for approval.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send request',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
      if(isLoading) return 'Loading your access status...'
      if(!existingRequest) return 'Request access to the application by choosing a role and submitting your request.'
      switch(existingRequest.status) {
          case 'pending':
              return 'Your access request is pending approval. Please check back later.';
          case 'approved':
              return 'Your access has been approved! The page will reload shortly.';
          case 'denied':
              return 'Your access request has been denied. Please contact an administrator for more information.';
          default:
              return 'Request access to the application by choosing a role and submitting your request.'
      }
  }

  if (existingRequest?.status === 'approved') {
    setTimeout(() => router.refresh(), 3000);
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Request Access</CardTitle>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </CardHeader>
        {(!existingRequest || existingRequest.status === 'denied') && (
            <>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label>Requested Role</label>
                    <Select onValueChange={(value: UserRole) => setRequestedRole(value)} defaultValue={requestedRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                        <SelectItem value="editor">Editor (Edit, no delete)</SelectItem>
                        <SelectItem value="manager">Manager (Edit and Delete)</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => auth?.signOut()}>
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                    <Button onClick={handleRequestAccess} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </CardFooter>
            </>
        )}
         {existingRequest && existingRequest.status === 'pending' && (
             <CardFooter className="flex justify-end">
                <Button variant="ghost" onClick={() => auth?.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
             </CardFooter>
         )}
      </Card>
    </div>
  );
}
