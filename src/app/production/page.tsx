
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Factory, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Item } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProductionCard from '@/components/dashboard/production-card';
import { format } from 'date-fns';

interface Machine {
    id: number;
    name: string;
}

export default function ProductionPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const [productionDate, setProductionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [machines, setMachines] = useState<Machine[]>([]);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const itemsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'items') : null, [firestore, user]);
    const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

    const addMachine = () => {
        const nextMachineNumber = machines.length + 1;
        setMachines([...machines, { id: nextMachineNumber, name: `Machine No. ${nextMachineNumber}` }]);
    };

    if (isUserLoading || itemsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Log Production</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="productionDate" className="text-sm font-medium">Production Date:</label>
                        <Input
                            type="date"
                            id="productionDate"
                            value={productionDate}
                            onChange={(e) => setProductionDate(e.target.value)}
                            className="w-48"
                        />
                    </div>
                    <Button onClick={addMachine}>
                        <Factory className="mr-2 h-4 w-4" /> Add Machine
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                {machines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <Factory className="w-16 h-16 mb-4"/>
                        <h2 className="text-xl font-semibold">No machines added yet.</h2>
                        <p>Click the "Add Machine" button to start logging production.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {machines.map((machine) => (
                            <ProductionCard 
                                key={machine.id} 
                                machineName={machine.name} 
                                items={items || []}
                                productionDate={productionDate}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
