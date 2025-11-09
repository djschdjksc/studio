'use client';

import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { NewItemDialog } from '@/components/dashboard/new-item-dialog';
import { Item, ItemGroup } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function NewItemPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const itemGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'itemGroups') : null, [firestore]);
    const { data: itemGroups } = useCollection<ItemGroup>(itemGroupsQuery);

    const addItem = async (item: Omit<Item, 'id' | 'price' | 'balance'>) => {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'items'));
        setDocumentNonBlocking(newDocRef, {...item, price: 0, balance: 0}, {});
        toast({ title: 'Item Added', description: `Added ${item.name}.` });
        router.push('/dashboard');
    };

    return (
        <NewItemDialog
            isOpen={true}
            onOpenChange={(isOpen) => {
                if (!isOpen) router.push('/dashboard');
            }}
            onSave={addItem}
            itemGroups={itemGroups?.map(g => g.name) || []}
        />
    )
}
