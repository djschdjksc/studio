
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { Item, SavedBill, WithId, ProductionLog } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface StockReportItem {
    id: string;
    name: string;
    openingBalance: number;
    production: number;
    sale: number;
    closingBalance: number;
}

export default function StockCheckPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [stockReport, setStockReport] = useState<StockReportItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    const itemsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'items') : null, [firestore, user]);
    const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

    const filteredStockReport = useMemo(() => {
        if (!searchQuery) {
            return stockReport;
        }
        return stockReport.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stockReport, searchQuery]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
        if (items && firestore && user) {
            generateReport();
        }
    }, [items, reportDate, firestore, user]);

    const generateReport = async () => {
        if (!firestore || !items || !user) return;
        setLoadingReport(true);

        const date = new Date(reportDate);
        const startOfReportDate = startOfDay(date);
        const endOfReportDate = endOfDay(date);

        try {
            // Fetch sales for the selected date
            const salesQuery = query(
                collection(firestore, 'billingRecords'),
                where('filters.date', '>=', startOfReportDate.toISOString()),
                where('filters.date', '<=', endOfReportDate.toISOString())
            );
            const salesSnapshot = await getDocs(salesQuery).catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: 'billingRecords',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            const dailySales = salesSnapshot.docs.flatMap(doc => (doc.data() as SavedBill).billingItems);

            // Fetch production for the selected date
            const prodQuery = query(
                collection(firestore, 'productionLogs'),
                where('date', '==', reportDate)
            );
            const prodSnapshot = await getDocs(prodQuery).catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: 'productionLogs',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            const dailyProduction = prodSnapshot.docs.map(doc => doc.data() as ProductionLog);

            const report: StockReportItem[] = items.map(item => {
                const closingBalance = item.balance ?? 0;

                const totalSaleQty = dailySales
                    .filter(sale => sale.itemName.toLowerCase() === item.name.toLowerCase())
                    .reduce((sum, sale) => sum + sale.quantity, 0);

                const totalProdQty = dailyProduction
                    .filter(prod => prod.itemId === item.id)
                    .reduce((sum, prod) => sum + prod.quantity, 0);

                const openingBalance = closingBalance - totalProdQty + totalSaleQty;

                return {
                    id: item.id,
                    name: item.name,
                    openingBalance,
                    production: totalProdQty,
                    sale: totalSaleQty,
                    closingBalance,
                };
            });

            setStockReport(report);
        } finally {
            setLoadingReport(false);
        }
    };


    if (isUserLoading || itemsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Stock Data...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Stock Check Report</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 sm:w-[200px] md:w-[300px]"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <label htmlFor="reportDate" className="text-sm font-medium">Report Date:</label>
                        <Input
                            type="date"
                            id="reportDate"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-48"
                        />
                    </div>
                    <Button onClick={generateReport} disabled={loadingReport}>
                        {loadingReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Report for {format(new Date(reportDate), 'PPP')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[70vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="text-right">Opening Balance</TableHead>
                                        <TableHead className="text-right text-green-600">Production</TableHead>
                                        <TableHead className="text-right text-red-600">Sale</TableHead>
                                        <TableHead className="text-right font-bold">Closing Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingReport ? (
                                         <TableRow><TableCell colSpan={5} className="text-center h-24">Generating report...</TableCell></TableRow>
                                    ) : filteredStockReport.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">{searchQuery ? 'No items match your search.' : 'No items found.'}</TableCell></TableRow>
                                    ) : (
                                        filteredStockReport.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{item.openingBalance}</TableCell>
                                                <TableCell className="text-right text-green-600">+{item.production}</TableCell>
                                                <TableCell className="text-right text-red-600">-{item.sale}</TableCell>
                                                <TableCell className="text-right font-bold">{item.closingBalance}</TableCell>
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
