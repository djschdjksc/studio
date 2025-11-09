'use client';

import { useFirestore, useAuth, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, where, query, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { NewPartyDialog } from '@/components/dashboard/new-party-dialog';
import { Party } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewPartyPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const partiesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'parties') : null, [firestore, user]);
    const { data: parties, isLoading: partiesLoading } = useCollection<Party>(partiesQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const addParty = async (party: Omit<Party, 'id'>) => {
        if (!firestore) return;

        // Validation check
        const isDuplicate = parties?.some(
            p => p.name.toLowerCase() === party.name.toLowerCase() && p.station.toLowerCase() === party.station.toLowerCase()
        );

        if (isDuplicate) {
            toast({
                variant: 'destructive',
                title: 'Duplicate Party',
                description: `A party with the name "${party.name}" and station "${party.station}" already exists.`,
            });
            return;
        }

        const newDocRef = doc(collection(firestore, 'parties'));
        setDocumentNonBlocking(newDocRef, party, {});
        toast({ title: 'Party Added', description: `Added ${party.name}.` });
        router.push('/dashboard');
    };
    
    if (isUserLoading || partiesLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

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
