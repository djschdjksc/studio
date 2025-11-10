
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { ProductionLog, WithId } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LogOut, Printer, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AllProductionPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({
        from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const productionLogsQuery = useMemoFirebase(
        () => (firestore && user) ? query(collection(firestore, 'productionLogs'), orderBy('date', 'desc')) : null,
        [firestore, user]
    );
    const { data: productionLogs, isLoading: logsLoading } = useCollection<ProductionLog>(productionLogsQuery);

    const filteredLogs = useMemo(() => {
        if (!productionLogs) return [];
        
        return productionLogs.filter(log => {
            const logDate = parseISO(log.date).getTime();
            const fromDate = parseISO(dateRange.from).getTime();
            const toDate = parseISO(dateRange.to).getTime() + 86400000; // include the whole "to" day

            const isDateInRange = logDate >= fromDate && logDate < toDate;
            if (!isDateInRange) return false;

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                return (
                    log.itemName.toLowerCase().includes(lowerQuery) ||
                    log.machineName.toLowerCase().includes(lowerQuery)
                );
            }
            
            return true;
        });

    }, [productionLogs, searchQuery, dateRange]);
    
    const handlePrint = () => {
        window.print();
    }


    if (isUserLoading || logsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Production Logs...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 print:bg-white">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6 print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">All Production Logs</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search item or machine..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 sm:w-[200px] md:w-[300px]"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
                            className="w-40"
                        />
                         <span>to</span>
                         <Input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
                            className="w-40"
                        />
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                <Card id="printable-area">
                    <CardHeader>
                        <CardTitle>Production Report</CardTitle>
                        <CardDescription>
                            Showing production logs from {format(parseISO(dateRange.from), 'PPP')} to {format(parseISO(dateRange.to), 'PPP')}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[70vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead>Machine Name</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No production logs found for the selected criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{format(parseISO(log.date), 'dd-MMM-yyyy')}</TableCell>
                                                <TableCell>{log.itemName}</TableCell>
                                                <TableCell>{log.machineName}</TableCell>
                                                <TableCell className="text-right font-semibold">{log.quantity}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <style jsx global>{`
                    @media print {
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
                        }
                    }
                `}</style>
            </main>
        </div>
    );
}
