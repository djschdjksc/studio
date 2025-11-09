
'use client';

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, SavedBill, WithId } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { AllBillsDialog } from '@/components/dashboard/all-bills-dialog';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AllBillsPage() {
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
  
  const billingRecordsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'billingRecords') : null, [firestore, user]);
  const { data: savedBillsData, isLoading: billsLoading } = useCollection<SavedBill>(billingRecordsQuery);

  const savedBills = React.useMemo(() => {
    if (!savedBillsData) return {};
    return savedBillsData.reduce((acc, bill) => {
        if(bill.filters.slipNo) {
            acc[bill.filters.slipNo] = bill;
        }
        return acc;
    }, {} as Record<string, WithId<SavedBill>>)
  }, [savedBillsData]);

  const handleLoadBill = (slipNo: string) => {
    router.push(`/billing?slipNo=${slipNo}`);
  };

  const handleDeleteBill = async (slipNo: string) => {
    if (!firestore) return;

    const billToDelete = savedBills[slipNo];
    if (billToDelete) {
        billToDelete.billingItems.forEach(billedItem => {
            const item = items?.find(i => i.name.toLowerCase() === billedItem.itemName.toLowerCase());
            if (item && billedItem.quantity > 0) {
                const itemRef = doc(firestore, 'items', item.id);
                updateDocumentNonBlocking(itemRef, {
                    balance: item.balance ? item.balance + billedItem.quantity : billedItem.quantity
                });
            }
        });
    }

    const docRef = doc(firestore, 'billingRecords', slipNo);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Bill Deleted",
        description: `Bill with Slip No. ${slipNo} has been deleted and stock has been restored.`,
    });
  };

  if (isUserLoading || itemsLoading || billsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Bills...</div>;
  }


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
            <div className='flex items-center gap-4'>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft/></Link>
                </Button>
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">All Bills</h1>
            </div>
            <div className="flex items-center gap-4">
                 <Button onClick={() => router.push('/billing')}>Create New Bill</Button>
                 <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
        <main className="flex-1">
             {/* This is a bit of a hack to use the dialog as a full page view */}
            <AllBillsDialog
                isOpen={true}
                onClose={() => router.push('/dashboard')}
                savedBills={savedBills}
                onLoadBill={handleLoadBill}
                onDeleteBill={handleDeleteBill}
                items={items || []}
                canDelete={true}
            />
        </main>
    </div>
  );
}
