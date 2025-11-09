
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, Party, SavedBill, WithId } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PartyBalance {
  id: string;
  name: string;
  station: string;
  balance: number;
}

const calculateGrandTotal = (bill: SavedBill, items: Item[]): number => {
    const summaryMap = new Map<string, { totalQty: number }>();
    bill.billingItems.forEach((billItem) => {
      const itemInfo = items.find((i) => i.name.toLowerCase() === billItem.itemName.toLowerCase());
      if (!itemInfo || !billItem.quantity || !itemInfo.group) return;
      const group = itemInfo.group;
      if (summaryMap.has(group)) {
        summaryMap.get(group)!.totalQty += billItem.quantity;
      } else {
        summaryMap.set(group, { totalQty: billItem.quantity });
      }
    });

    const uCapTotal = bill.billingItems.reduce((sum, item) => sum + (item.uCap || 0), 0);
    const lCapTotal = bill.billingItems.reduce((sum, item) => sum + (item.lCap || 0), 0);

    const allSummaryItems = Array.from(summaryMap.entries()).map(([item, data]) => {
      const groupKey = item.toLowerCase();
      const price = bill.manualPrices[groupKey] !== undefined ? bill.manualPrices[groupKey] : 0;
      return {
        totalPrice: data.totalQty * price,
      };
    });

    const uCapPrice = bill.manualPrices["u cap"] !== undefined ? bill.manualPrices["u cap"] : 0;
    if (uCapTotal > 0 || bill.manualPrices["u cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: uCapTotal * uCapPrice,
      });
    }

    const lCapPrice = bill.manualPrices["l cap"] !== undefined ? bill.manualPrices["l cap"] : 0;
    if (lCapTotal > 0 || bill.manualPrices["l cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: lCapTotal * lCapPrice,
      });
    }

    return allSummaryItems.reduce((acc, item) => acc + item.totalPrice, 0);
};

export default function PartyBalancesPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<PartyBalance | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const itemsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'items') : null, [firestore, user]);
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  const partiesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'parties') : null, [firestore, user]);
  const { data: parties, isLoading: partiesLoading } = useCollection<Party>(partiesQuery);
  
  const billingRecordsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'billingRecords') : null, [firestore, user]);
  const { data: savedBillsData, isLoading: billsLoading } = useCollection<SavedBill>(billingRecordsQuery);

  const partyBalances = useMemo(() => {
    if (!parties || !savedBillsData || !items) return [];

    const balances: Record<string, number> = {};

    savedBillsData.forEach(bill => {
        const partyName = bill.filters.partyName;
        if(partyName) {
            const billTotal = calculateGrandTotal(bill, items);
            balances[partyName] = (balances[partyName] || 0) + billTotal;
        }
    });

    return parties.map(party => ({
        id: party.id,
        name: party.name,
        station: party.station,
        balance: balances[party.name] || 0
    })).sort((a,b) => b.balance - a.balance);

  }, [parties, savedBillsData, items]);


  const filteredPartyBalances = useMemo(() => {
    if (!searchQuery) {
        return partyBalances;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return partyBalances.filter(party =>
        (party.name && party.name.toLowerCase().includes(lowerCaseQuery)) ||
        (party.station && party.station.toLowerCase().includes(lowerCaseQuery))
    );
  }, [partyBalances, searchQuery]);

  const handleRowClick = (party: PartyBalance) => {
    setSelectedParty(party);
  };


  if (isUserLoading || itemsLoading || partiesLoading || billsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Party Balances...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Party Balances</h1>
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
        <main className="flex-1 p-6">
            {selectedParty && (
                <Card className="mb-6 bg-primary/10 border-primary/50">
                    <CardHeader>
                        <CardTitle className="text-primary">{selectedParty.name}</CardTitle>
                        <CardDescription>{selectedParty.station}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-muted-foreground">Total Outstanding Balance</p>
                        <p className="text-3xl font-bold text-primary">
                            ₹{selectedParty.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>All Parties</CardTitle>
                    <CardDescription>Click on a party to view their total balance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[65vh]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Party Name</TableHead>
                                    <TableHead>Station</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPartyBalances.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center h-24">{searchQuery ? 'No parties match your search.' : 'No parties found.'}</TableCell></TableRow>
                                ) : (
                                    filteredPartyBalances.map(party => (
                                        <TableRow 
                                            key={party.id} 
                                            onClick={() => handleRowClick(party)} 
                                            className={`cursor-pointer ${selectedParty?.id === party.id ? 'bg-accent/50 hover:bg-accent/60' : ''}`}
                                        >
                                            <TableCell className="font-medium">{party.name}</TableCell>
                                            <TableCell>{party.station}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                 ₹{party.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
