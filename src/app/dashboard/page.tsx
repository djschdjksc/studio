
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FilePlus, Users, Package, Boxes, Library, LogOut, Shield, Import, Factory, CheckSquare, Banknote } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useState, useMemo } from "react";
import { ImportExportDialog } from "@/components/dashboard/import-export-dialog";
import { Party, Item, SavedBill, WithId } from "@/lib/types";
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from "@/hooks/use-toast";
import { collection, doc } from "firebase/firestore";

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    
    const isAdmin = user?.email === 'rohitvetma101010@gmail.com';

    // Data fetching for Import/Export dialog
    const partiesQuery = useMemoFirebase(() => firestore && user ? collection(firestore, 'parties') : null, [firestore, user]);
    const { data: parties } = useCollection<Party>(partiesQuery);

    const itemsQuery = useMemoFirebase(() => firestore && user ? collection(firestore, 'items') : null, [firestore, user]);
    const { data: items } = useCollection<Item>(itemsQuery);
    
    const billingRecordsQuery = useMemoFirebase(() => firestore && user ? collection(firestore, 'billingRecords') : null, [firestore, user]);
    const { data: savedBillsData } = useCollection<SavedBill>(billingRecordsQuery);

    const savedBills = useMemo(() => {
        if (!savedBillsData) return [];
        return Object.values(savedBillsData.reduce((acc, bill) => {
            if(bill.filters.slipNo) {
                acc[bill.filters.slipNo] = bill;
            }
            return acc;
        }, {} as Record<string, WithId<SavedBill>>))
    }, [savedBillsData]);

    const handlePartyUpload = async (uploadedParties: Omit<Party, 'id'>[]) => {
        if (!firestore || !parties) return;
    
        const existingParties = new Set(
            parties.map(p => `${p.name.toLowerCase().trim()}|${p.station.toLowerCase().trim()}`)
        );
    
        let importedCount = 0;
        let skippedCount = 0;
    
        for (const p of uploadedParties) {
            const key = `${p.name.toLowerCase().trim()}|${p.station.toLowerCase().trim()}`;
            if (existingParties.has(key)) {
                skippedCount++;
            } else {
                const newDocRef = doc(collection(firestore, 'parties'));
                setDocumentNonBlocking(newDocRef, p, {});
                existingParties.add(key); // Add to set to avoid duplicates within the same file
                importedCount++;
            }
        }
    
        toast({
            title: "Party Import Complete!",
            description: `Imported ${importedCount} new parties. Skipped ${skippedCount} duplicates.`,
        });
    }

    const handleItemUpload = async (uploadedItems: Omit<Item, 'id' | 'price' | 'balance'>[]) => {
        if (!firestore || !items) return;
        // This simple replacement logic is kept for items as duplicates are less critical.
        // A more advanced implementation could check for duplicates here as well.
        for (const item of uploadedItems) {
            const newDocRef = doc(collection(firestore, 'items'));
            setDocumentNonBlocking(newDocRef, {...item, price: 0, balance: 0}, {});
        }
        toast({
            title: "Items Imported!",
            description: `Imported ${uploadedItems.length} items.`,
        });
    };

    const actions = [
        {
            title: "Sale Bill",
            description: "Create a new bill for a customer.",
            icon: <FilePlus className="h-8 w-8 text-primary" />,
            href: "/billing",
        },
        {
            title: "Manage Stock",
            description: "Add inventory and view item balances.",
            icon: <Boxes className="h-8 w-8 text-green-600" />,
            href: "/stock",
        },
        {
            title: "Production",
            description: "Log daily production from machines.",
            icon: <Factory className="h-8 w-8 text-purple-600" />,
            href: "/production",
        },
        {
            title: "All Bills",
            description: "View, edit, or delete all saved bills.",
            icon: <Library className="h-8 w-8 text-yellow-600" />,
            href: "/bills",
        },
        {
            title: "Stock Check",
            description: "View opening and closing stock.",
            icon: <CheckSquare className="h-8 w-8 text-blue-600" />,
            href: "/stock-check",
        },
        {
            title: "Party Balances",
            description: "View and manage party balances.",
            icon: <Banknote className="h-8 w-8 text-teal-600" />,
            href: "/party-balances",
        },
        {
            title: "New Party",
            description: "Add a new customer or supplier.",
            icon: <Users className="h-8 w-8 text-indigo-600" />,
            href: "/masters/party",
        },
        {
            title: "New Item",
            description: "Add a new product to your inventory.",
            icon: <Package className="h-8 w-8 text-rose-600" />,
            href: "/masters/item",
        },
        {
            title: "Import/Export",
            description: "Backup or restore your data.",
            icon: <Import className="h-8 w-8 text-cyan-600" />,
            action: () => setIsImportExportOpen(true)
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
             <ImportExportDialog
                isOpen={isImportExportOpen}
                onClose={() => setIsImportExportOpen(false)}
                data={{ parties: parties || [], items: items || [], savedBills: savedBills || [] }}
                onImportParties={handlePartyUpload}
                onImportItems={handleItemUpload}
                canEdit={isAdmin}
            />
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro Dashboard</h1>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Button variant="secondary" asChild>
                            <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {actions.map((action) => (
                         <Card 
                            key={action.title} 
                            className="transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-1"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                                {action.icon}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                                <Button className="w-full" onClick={() => action.href ? router.push(action.href) : action.action?.()}>Go</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}
