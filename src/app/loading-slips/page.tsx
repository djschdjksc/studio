'use client';

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, SavedLoadingSlip, WithId } from '@/lib/types';
import React, { useEffect, useMemo } from 'react';
import { AllLoadingSlipsDialog } from '@/components/dashboard/all-loading-slips-dialog';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AllLoadingSlipsPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const itemsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'items') : null, [firestore, user]);
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);
  
  const loadingSlipsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'loadingSlips') : null, [firestore, user]);
  const { data: savedSlipsData, isLoading: slipsLoading } = useCollection<SavedLoadingSlip>(loadingSlipsQuery);

  const savedSlips = useMemo(() => {
    if (!savedSlipsData) return {};
    return savedSlipsData.reduce((acc, slip) => {
        if(slip.filters.slipNo) {
            acc[slip.filters.slipNo] = slip;
        }
        return acc;
    }, {} as Record<string, WithId<SavedLoadingSlip>>)
  }, [savedSlipsData]);

  const handleLoadSlip = (slipNo: string) => {
    router.push(`/loading-slip?slipNo=${slipNo}`);
  };

  const handleDeleteSlip = async (slipNo: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'loadingSlips', slipNo);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Loading Slip Deleted",
        description: `Slip No. ${slipNo} has been deleted.`,
    });
  };
  
  const handleConvertToBill = (slipNo: string) => {
    if (!firestore) return;
    // Redirect to billing page with loading slipNo to load data
    router.push(`/billing?loadingSlipNo=${slipNo}`);
    toast({
      title: "Slip Converted",
      description: `Loading slip ${slipNo} into billing page.`,
    });
  }


  if (isUserLoading || itemsLoading || slipsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Slips...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
            <div className='flex items-center gap-4'>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft/></Link>
                </Button>
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">All Loading Slips</h1>
            </div>
            <div className="flex items-center gap-4">
                 <Button onClick={() => router.push('/loading-slip')}>Create New Slip</Button>
                 <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
        <main className="flex-1">
            <AllLoadingSlipsDialog
                isOpen={true}
                onClose={() => router.push('/dashboard')}
                savedSlips={savedSlips}
                onLoadSlip={handleLoadSlip}
                onDeleteSlip={handleDeleteSlip}
                onConvertToBill={handleConvertToBill}
                items={items || []}
                canDelete={true}
            />
        </main>
    </div>
  );
}
