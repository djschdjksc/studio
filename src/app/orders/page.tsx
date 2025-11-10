'use client';

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, SavedOrder, WithId } from '@/lib/types';
import React, { useEffect, useMemo } from 'react';
import { AllOrdersDialog } from '@/components/dashboard/all-orders-dialog';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AllOrdersPage() {
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
  
  const ordersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'orders') : null, [firestore, user]);
  const { data: savedOrdersData, isLoading: ordersLoading } = useCollection<SavedOrder>(ordersQuery);

  const savedOrders = useMemo(() => {
    if (!savedOrdersData) return {};
    return savedOrdersData.reduce((acc, order) => {
        if(order.filters.slipNo) {
            acc[order.filters.slipNo] = order;
        }
        return acc;
    }, {} as Record<string, WithId<SavedOrder>>)
  }, [savedOrdersData]);

  const handleLoadOrder = (slipNo: string) => {
    router.push(`/orders/create?slipNo=${slipNo}`);
  };

  const handleDeleteOrder = async (slipNo: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'orders', slipNo);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Order Deleted",
        description: `Order with Slip No. ${slipNo} has been deleted.`,
    });
  };

  const handleConvertToBill = (slipNo: string) => {
    if (!firestore) return;
    // Update order status to 'completed'
    const orderRef = doc(firestore, 'orders', slipNo);
    updateDocumentNonBlocking(orderRef, { 'filters.orderStatus': 'completed' });
    
    // Redirect to billing page with order slipNo to load data
    router.push(`/billing?orderSlipNo=${slipNo}`);
    toast({
      title: "Order Converted",
      description: `Loading order ${slipNo} into billing page.`,
    });
  }

  if (isUserLoading || itemsLoading || ordersLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Orders...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
            <div className='flex items-center gap-4'>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft/></Link>
                </Button>
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">All Orders</h1>
            </div>
            <div className="flex items-center gap-4">
                 <Button onClick={() => router.push('/orders/create')}>Create New Order</Button>
                 <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
        <main className="flex-1">
            <AllOrdersDialog
                isOpen={true}
                onClose={() => router.push('/dashboard')}
                savedOrders={savedOrders}
                onLoadOrder={handleLoadOrder}
                onDeleteOrder={handleDeleteOrder}
                onConvertToBill={handleConvertToBill}
                items={items || []}
                canDelete={true} // Assuming owner can delete
            />
        </main>
    </div>
  );
}