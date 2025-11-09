'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { WithId, Item, UserProfile } from '@/lib/types';
import StockManagement from '@/components/dashboard/stock-management';
import { doc, updateDoc, increment, collection } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function StockPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: items } = useCollection<Item>(itemsQuery);

  const handleAddStock = async (itemId: string, quantity: number) => {
    if (!firestore) return;
    const itemRef = doc(firestore, 'items', itemId);
    updateDocumentNonBlocking(itemRef, {
        balance: increment(quantity)
    });
    toast({
        title: 'Stock Added',
        description: `Added ${quantity} to the item's balance.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft/></Link>
                </Button>
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Manage Stock</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                <LogOut className="h-4 w-4" />
            </Button>
        </header>
        <main className="flex-1 p-6 flex items-start justify-center">
            <div className="w-full max-w-md">
                <StockManagement
                    items={items || []}
                    onAddStock={handleAddStock}
                    canEdit={true} 
                />
            </div>
        </main>
    </div>
  );
}
