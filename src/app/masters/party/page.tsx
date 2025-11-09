'use client';

import { useFirestore, useAuth } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { NewPartyDialog } from '@/components/dashboard/new-party-dialog';
import { Party } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function NewPartyPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const addParty = async (party: Omit<Party, 'id'>) => {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'parties'));
        setDocumentNonBlocking(newDocRef, party, {});
        toast({ title: 'Party Added', description: `Added ${party.name}.` });
        router.push('/dashboard');
    };

    return (
        <NewPartyDialog
            isOpen={true}
            onOpenChange={(isOpen) => {
                if (!isOpen) router.push('/dashboard');
            }}
            onSave={addParty}
        />
    )
}
