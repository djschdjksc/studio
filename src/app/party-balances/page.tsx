
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, Party, SavedBill, Payment, WithId } from '@/lib/types';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, LogOut, Search, PlusCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddPaymentDialog } from '@/components/dashboard/add-payment-dialog';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface PartyBalance {
  id: string;
  name: string;
  station: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: 'bill' | 'payment';
  slipNo?: string;
  date: Date;
  particulars: string;
  debit: number;
  credit: number;
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
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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
  
  const paymentsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'payments') : null, [firestore, user]);
  const { data: paymentsData, isLoading: paymentsLoading } = useCollection<Payment>(paymentsQuery);


  const partyBalances = useMemo(() => {
    if (!parties || !savedBillsData || !items || !paymentsData) return [];

    const balances: Record<string, number> = {};

    savedBillsData.forEach(bill => {
        const partyName = bill.filters.partyName;
        if(partyName) {
            const billTotal = calculateGrandTotal(bill, items);
            // A "sale" increases the balance (debit), a "sale-return" decreases it (credit).
            const amount = bill.filters.billType === 'sale-return' ? -billTotal : billTotal;
            balances[partyName] = (balances[partyName] || 0) + amount;
        }
    });

    paymentsData.forEach(payment => {
        const partyName = payment.partyName;
        if(partyName) {
            balances[partyName] = (balances[partyName] || 0) - payment.amount;
        }
    })

    return parties.map(party => ({
        id: party.id,
        name: party.name,
        station: party.station,
        balance: balances[party.name] || 0
    })).sort((a,b) => a.name.localeCompare(b.name));

  }, [parties, savedBillsData, items, paymentsData]);

  const transactionLedger = useMemo((): Transaction[] => {
    if (!selectedParty || !savedBillsData || !paymentsData || !items) return [];

    const bills: Transaction[] = savedBillsData
        .filter(bill => bill.filters.partyName === selectedParty.name)
        .map(bill => {
            const billTotal = calculateGrandTotal(bill, items);
            const isReturn = bill.filters.billType === 'sale-return';
            return {
                id: `bill-${bill.id}`,
                type: 'bill',
                slipNo: bill.filters.slipNo,
                date: bill.filters.date ? parseISO(String(bill.filters.date)) : new Date(),
                particulars: isReturn ? `Sale Return - Slip No: ${bill.filters.slipNo}` : `Sale - Slip No: ${bill.filters.slipNo}`,
                debit: isReturn ? 0 : billTotal,
                credit: isReturn ? billTotal : 0
            }
        });
    
    const payments: Transaction[] = paymentsData
        .filter(payment => payment.partyName === selectedParty.name)
        .map(payment => ({
            id: `payment-${payment.id}`,
            type: 'payment',
            date: parseISO(payment.date),
            particulars: `Payment Received ${payment.notes ? `(${payment.notes})` : ''}`,
            debit: 0,
            credit: payment.amount
        }));

    return [...bills, ...payments].sort((a,b) => a.date.getTime() - b.date.getTime());

  }, [selectedParty, savedBillsData, paymentsData, items]);

  const finalBalance = transactionLedger.reduce((acc, tx) => acc + tx.debit - tx.credit, 0);


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

  const handleRowClick = (partySummary: PartyBalance) => {
    const fullParty = parties?.find(p => p.id === partySummary.id);
    if (fullParty) {
        setSelectedParty(fullParty);
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (transaction.type === 'bill' && transaction.slipNo) {
        router.push(`/billing?slipNo=${transaction.slipNo}`);
    }
  }
  
  const handleAddPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'partyName' | 'partyId'>) => {
    if (!firestore || !selectedParty) return;

    const newDocRef = doc(collection(firestore, 'payments'));
    const newPayment: Omit<Payment, 'id'> = {
        ...paymentData,
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        createdAt: new Date().toISOString()
    };
    
    setDocumentNonBlocking(newDocRef, newPayment, {});

    toast({
        title: "Payment Saved",
        description: `Payment of ₹${paymentData.amount} for ${selectedParty.name} has been recorded.`,
    });
    setIsPaymentDialogOpen(false);
  }

  const handlePrint = () => {
    if (!selectedParty) {
        toast({
            variant: 'destructive',
            title: 'No Party Selected',
            description: 'Please select a party to print their ledger.'
        });
        return;
    }
    window.print();
  }

  if (isUserLoading || itemsLoading || partiesLoading || billsLoading || paymentsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Party Balances...</div>;
  }

  return (
    <>
    <AddPaymentDialog 
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSave={handleAddPayment}
        partyName={selectedParty?.name || ''}
    />
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden print:bg-white">
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6 shrink-0 print:hidden">
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
                <Button onClick={handlePrint} variant="outline">
                    <Printer className="mr-2 h-4 w-4" /> Print Ledger
                </Button>
                <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden">
            <Card className="md:col-span-1 flex flex-col print:hidden">
                <CardHeader>
                    <CardTitle>All Parties</CardTitle>
                    <CardDescription>Select a party to view their ledger.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Party Name</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPartyBalances.length === 0 ? (
                                    <TableRow><TableCell colSpan={2} className="text-center h-24">{searchQuery ? 'No parties match your search.' : 'No parties found.'}</TableCell></TableRow>
                                ) : (
                                    filteredPartyBalances.map(party => (
                                        <TableRow 
                                            key={party.id} 
                                            onClick={() => handleRowClick(party)} 
                                            className={`cursor-pointer ${selectedParty?.id === party.id ? 'bg-accent/50 hover:bg-accent/60' : 'hover:bg-muted/50'}`}
                                        >
                                            <TableCell className="font-medium">{party.name}</TableCell>
                                            <TableCell className={`text-right font-semibold ${party.balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                 ₹{Math.abs(party.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="md:col-span-2 flex flex-col gap-6" id="printable-area">
                {selectedParty ? (
                    <Card className="flex-grow flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="print:hidden">
                                <CardTitle className="text-primary">{selectedParty.name}</CardTitle>
                                <CardDescription>{selectedParty.station}</CardDescription>
                            </div>
                            <Button onClick={() => setIsPaymentDialogOpen(true)} className="print:hidden">
                                <PlusCircle className="mr-2 h-4 w-4"/> Add Payment
                            </Button>
                        </CardHeader>
                         <div className="hidden print:block p-6">
                             <h1 className="text-2xl font-bold">Ledger for {selectedParty.name}</h1>
                             <p className="text-muted-foreground">{selectedParty.station}</p>
                         </div>
                        <CardContent className="flex-grow overflow-hidden p-0">
                           <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Particulars</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Credit</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactionLedger.length > 0 ? transactionLedger.reduce((acc, tx) => {
                                            const runningBalance = acc.balance + tx.debit - tx.credit;
                                            const isBill = tx.type === 'bill';
                                            acc.rows.push(
                                                <TableRow 
                                                    key={tx.id} 
                                                    onClick={() => handleTransactionClick(tx)}
                                                    className={isBill ? 'cursor-pointer hover:bg-muted/50' : ''}
                                                >
                                                    <TableCell>{format(tx.date, 'dd-MMM-yy')}</TableCell>
                                                    <TableCell>{tx.particulars}</TableCell>
                                                    <TableCell className="text-right">{tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : ''}</TableCell>
                                                    <TableCell className="text-right text-green-600">{tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : ''}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${runningBalance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        ₹{Math.abs(runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                            acc.balance = runningBalance;
                                            return acc;
                                        }, { rows: [] as JSX.Element[], balance: 0 }).rows : (
                                            <TableRow><TableCell colSpan={5} className="text-center h-24">No transactions found for this party.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                         <CardFooter className="bg-muted/50 p-4 border-t flex justify-end">
                             <div className="text-right">
                                <p className="text-sm font-medium text-muted-foreground">Final Balance</p>
                                <p className={`text-2xl font-bold ${finalBalance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                ) : (
                     <Card className="flex-grow flex items-center justify-center print:hidden">
                        <div className="text-center text-muted-foreground">
                            <p className="text-lg font-semibold">Select a party</p>
                            <p>Choose a party from the list to see their transaction ledger.</p>
                        </div>
                    </Card>
                )}
            </div>
        </main>
         <style jsx global>{`
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                     print-color-adjust: exact;
                }
                body * {
                    visibility: hidden;
                }
                #printable-area, #printable-area * {
                    visibility: visible;
                }
                #printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        `}</style>
    </div>
    </>
  );
}
