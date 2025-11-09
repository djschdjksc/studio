
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { ItemGroup, Party, WithId } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Save, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type EditablePartyPrice = {
    partyId: string;
    partyName: string;
    prices: Record<string, number | ''>;
};

export default function PartyPricesPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [editablePrices, setEditablePrices] = useState<Record<string, EditablePartyPrice>>({});
    const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const partiesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'parties') : null, [firestore, user]);
    const { data: parties, isLoading: partiesLoading } = useCollection<Party>(partiesQuery);

    const itemGroupsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'itemGroups') : null, [firestore, user]);
    const { data: itemGroups, isLoading: groupsLoading } = useCollection<ItemGroup>(itemGroupsQuery);
    
    const allGroupNames = useMemo(() => {
        const groupSet = new Set<string>();
        itemGroups?.forEach(g => groupSet.add(g.name.toLowerCase()));
        groupSet.add('u cap');
        groupSet.add('l cap');
        return Array.from(groupSet);
    }, [itemGroups]);

    useEffect(() => {
        if (parties) {
            const initialPrices: Record<string, EditablePartyPrice> = {};
            parties.forEach(party => {
                initialPrices[party.id] = {
                    partyId: party.id,
                    partyName: party.name,
                    prices: party.priceList || {},
                };
            });
            setEditablePrices(initialPrices);
        }
    }, [parties]);
    
    const filteredParties = useMemo(() => {
        if (!parties) return [];
        if (!searchQuery) return parties;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return parties.filter(party => party.name.toLowerCase().includes(lowerCaseQuery));
    }, [parties, searchQuery]);

    const handlePriceChange = (partyId: string, group: string, value: string) => {
        const numericValue = value === '' ? '' : Number(value);
        if (isNaN(numericValue as number)) return;

        setEditablePrices(prev => ({
            ...prev,
            [partyId]: {
                ...prev[partyId],
                prices: {
                    ...prev[partyId].prices,
                    [group.toLowerCase()]: numericValue,
                },
            },
        }));

        setDirtyRows(prev => new Set(prev).add(partyId));
    };

    const handleSave = (partyId: string) => {
        if (!firestore) return;

        const partyData = editablePrices[partyId];
        if (!partyData) return;

        // Filter out any empty string prices before saving
        const pricesToSave = Object.entries(partyData.prices).reduce((acc, [key, value]) => {
            if (value !== '') {
                acc[key] = value as number;
            }
            return acc;
        }, {} as Record<string, number>);

        const partyRef = doc(firestore, 'parties', partyId);
        updateDocumentNonBlocking(partyRef, { priceList: pricesToSave });

        toast({
            title: "Prices Updated",
            description: `Custom prices for ${partyData.partyName} have been saved.`,
        });

        setDirtyRows(prev => {
            const newSet = new Set(prev);
            newSet.delete(partyId);
            return newSet;
        });
    };
    
    if (isUserLoading || partiesLoading || groupsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Party Prices...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Party Price Lists</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search parties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 sm:w-[200px] md:w-[300px]"
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Master Price List</CardTitle>
                        <CardDescription>Set and manage custom prices for each party and item group.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="min-w-[200px] sticky left-0 bg-background z-20">Party Name</TableHead>
                                        {allGroupNames.map(group => (
                                            <TableHead key={group} className="text-right capitalize min-w-[120px]">{group}</TableHead>
                                        ))}
                                        <TableHead className="sticky right-0 bg-background z-20 w-[100px] text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParties.map(party => (
                                        <TableRow key={party.id}>
                                            <TableCell className="font-medium sticky left-0 bg-white dark:bg-card z-10">{party.name}</TableCell>
                                            {allGroupNames.map(group => (
                                                <TableCell key={group} className="text-right">
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="text-right"
                                                        value={editablePrices[party.id]?.prices[group.toLowerCase()] ?? ''}
                                                        onChange={(e) => handlePriceChange(party.id, group, e.target.value)}
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="sticky right-0 bg-white dark:bg-card z-10 text-center">
                                                {dirtyRows.has(party.id) && (
                                                    <Button size="sm" onClick={() => handleSave(party.id)}>
                                                        <Save className="mr-2 h-4 w-4"/>
                                                        Save
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
