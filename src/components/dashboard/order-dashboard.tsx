
'use client';

import { NewItemDialog } from '@/components/dashboard/new-item-dialog';
import { NewPartyDialog } from '@/components/dashboard/new-party-dialog';
import OrderSearchFilters from '@/components/dashboard/order-search-filters';
import MainBillingTable from '@/components/dashboard/main-billing-table';
import TotalsSummary from '@/components/dashboard/totals-summary';
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Party, Item, BillingItem, OrderFiltersState, SavedOrder, WithId, ItemGroup } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BookOpen, Save, LogOut, PackagePlus, UserPlus, Layers, ArrowLeft } from 'lucide-react';
import { NewItemGroupDialog } from './new-item-group-dialog';
import { useToast } from '@/hooks/use-toast';
import { BulkAddItemDialog } from './bulk-add-item-dialog';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useSearchParams } from 'next/navigation';
import type { User } from 'firebase/auth';

const generateInitialBillingItems = (count: number): BillingItem[] => {
    return Array.from({ length: count }, (_, i) => ({
        srNo: i + 1,
        itemName: "",
        quantity: 0,
        unit: "",
        uCap: 0,
        lCap: 0,
    }));
};

const initialFilters: Omit<OrderFiltersState, 'date'> = {
    partyName: "",
    address: "",
    slipNo: "",
    orderStatus: "pending",
    notes: "",
};

interface OrderDashboardProps {
  user: User | null;
}

function OrderDashboardContent({ user }: OrderDashboardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const canEdit = user?.email === 'rohitvetma101010@gmail.com';

  const partiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'parties') : null, [firestore]);
  const { data: parties } = useCollection<Party>(partiesQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: items } = useCollection<Item>(itemsQuery);

  const itemGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'itemGroups') : null, [firestore]);
  const { data: itemGroups } = useCollection<ItemGroup>(itemGroupsQuery);

  const ordersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
  const { data: savedOrdersData } = useCollection<SavedOrder>(ordersQuery);

  const [billingItems, setBillingItems] = useState<BillingItem[]>(generateInitialBillingItems(5));
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [searchFilters, setSearchFilters] = useState<OrderFiltersState>({
    ...initialFilters,
    date: new Date(),
  });

  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isNewPartyOpen, setIsNewPartyOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const selectedParty = useMemo(() => {
    return parties?.find(p => p.name.toLowerCase() === searchFilters.partyName.toLowerCase());
  }, [parties, searchFilters.partyName]);


  const savedOrders = React.useMemo(() => {
    if (!savedOrdersData) return {};
    return savedOrdersData.reduce((acc, order) => {
        if(order.filters.slipNo) {
            acc[order.filters.slipNo] = order;
        }
        return acc;
    }, {} as Record<string, WithId<SavedOrder>>)
  }, [savedOrdersData]);


  useEffect(() => {
    if(!canEdit || !savedOrders) return;
    
    const slipNoFromUrl = searchParams.get('slipNo');
    if (slipNoFromUrl) {
      handleLoadOrder(slipNoFromUrl);
    } else {
      const slipNumbers = Object.values(savedOrders).map(order => Number(order.filters.slipNo)).filter(n => !isNaN(n));
      const nextSlipNo = slipNumbers.length > 0 ? String(Math.max(...slipNumbers) + 1) : "1";
      setSearchFilters(prev => ({...prev, slipNo: nextSlipNo}));
    }
  }, [savedOrders, canEdit, searchParams]);

  const clearForm = useCallback((nextSlipNo: string) => {
    setBillingItems(generateInitialBillingItems(5));
    setManualPrices({});
    setSearchFilters(prev => ({
        ...initialFilters,
        date: prev.date, // Keep the same date
        slipNo: nextSlipNo,
    }));
  }, []);

  // Effect to load party price list or last bill prices
  useEffect(() => {
    if (!selectedParty || !firestore) {
      setManualPrices({});
      return;
    }

    if (selectedParty.priceList && Object.keys(selectedParty.priceList).length > 0) {
        setManualPrices(selectedParty.priceList);
        return;
    }
  }, [selectedParty, firestore]);


  const addParty = async (party: Omit<Party, 'id'>) => {
    if (!canEdit || !firestore) return;
    const newDocRef = doc(collection(firestore, 'parties'));
    setDocumentNonBlocking(newDocRef, party, {});
    toast({ title: 'Party Added', description: `Added ${party.name}.` });
  };
  

  const addItem = async (item: Omit<Item, 'id' | 'price' | 'balance'>) => {
    if (!canEdit || !firestore) return;
    const newDocRef = doc(collection(firestore, 'items'));
    setDocumentNonBlocking(newDocRef, {...item, price: 0, balance: 0}, {});
    toast({ title: 'Item Added', description: `Added ${item.name}.` });
  };
  
  const addBulkItems = async (newItems: Omit<Item, 'id' | 'price' | 'balance'>[]) => {
    if (!canEdit || !firestore) return;
    for (const item of newItems) {
        const newDocRef = doc(collection(firestore, 'items'));
        setDocumentNonBlocking(newDocRef, {...item, price: 0, balance: 0}, {});
    }
    toast({
      title: "Items Added!",
      description: `${newItems.length} new items have been added.`,
    });
  };
  
  const addItemGroup = async (groupName: string) => {
    if (!canEdit || !firestore) return;
    if (groupName && !itemGroups?.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
        const newDocRef = doc(collection(firestore, 'itemGroups'));
        setDocumentNonBlocking(newDocRef, { name: groupName }, {});
        toast({ title: 'Item Group Added', description: `Added ${groupName}.` });
    }
  };

  const addBillingItem = () => {
    setBillingItems(prev => [...prev, { srNo: prev.length + 1, itemName: "", quantity: 0, unit: "", uCap: 0, lCap: 0 }]);
  }
  
  const removeBillingItem = (srNo: number) => {
    setBillingItems(prev => prev.filter(item => item.srNo !== srNo).map((item, index) => ({...item, srNo: index + 1})));
  }

  const handleBillingItemChange = (index: number, field: keyof BillingItem, value: string | number) => {
    const updatedItems = [...billingItems];
    const itemToUpdate = { ...updatedItems[index] };
    
    if (typeof itemToUpdate[field] === 'number') {
        const numValue = Number(value);
        (itemToUpdate[field] as number) = isNaN(numValue) ? 0 : numValue;
    } else {
        (itemToUpdate[field] as string) = String(value);
    }

    if (field === 'itemName' && items) {
      const selectedItem = items.find(i => i.name.toLowerCase() === String(value).toLowerCase());
      if (selectedItem) {
        itemToUpdate.unit = selectedItem.unit;
      } else {
        itemToUpdate.unit = "";
      }
    }

    updatedItems[index] = itemToUpdate;
    setBillingItems(updatedItems);
  };

  const handleManualPriceChange = (group: string, price: number) => {
    setManualPrices(prev => ({...prev, [group.toLowerCase()]: price}))
  }

  const handleSaveOrder = async () => {
    if (!canEdit || !firestore) return;
    if (!searchFilters.slipNo) {
      toast({
        variant: "destructive",
        title: "Order No. required",
        description: "Please enter an Order No. before saving.",
      });
      return;
    }
     if (!selectedParty) {
      toast({
        variant: 'destructive',
        title: 'Party Not Selected',
        description: 'Please select a party before saving.',
      });
      return;
    }

    const orderData: Omit<SavedOrder, 'id'> = {
      filters: { ...searchFilters, date: searchFilters.date ? new Date(searchFilters.date).toISOString() : new Date().toISOString() },
      billingItems: billingItems.filter(item => item.itemName && item.quantity),
      manualPrices
    };
    
    // Save the order
    const docRef = doc(firestore, 'orders', searchFilters.slipNo);
    setDocumentNonBlocking(docRef, orderData, {});

    // Save the price list to the party
    const partyRef = doc(firestore, 'parties', selectedParty.id);
    updateDocumentNonBlocking(partyRef, { priceList: manualPrices });


    toast({
        title: "Order Saved!",
        description: `Order with No. ${searchFilters.slipNo} has been saved successfully.`,
    });

    const currentSlipNo = Number(searchFilters.slipNo);
    const nextSlipNo = isNaN(currentSlipNo) ? "" : String(currentSlipNo + 1);

    clearForm(nextSlipNo);
  }

  const handleLoadOrder = useCallback((slipNoToLoad?: string) => {
    const slipNo = slipNoToLoad || searchFilters.slipNo;

    if(!slipNo) {
        toast({
            variant: "destructive",
            title: "Order No. required",
            description: "Please enter an Order No. to load an order.",
        });
        return;
    }
    const orderData = savedOrders[slipNo];

    if (orderData) {
      const loadedFilters = {
        ...orderData.filters,
        date: orderData.filters.date ? new Date(orderData.filters.date) : new Date(),
      };
      setSearchFilters(loadedFilters);
      
      const loadedItems = orderData.billingItems.length > 0 ? orderData.billingItems.map((item, index) => ({...item, srNo: index + 1})) : generateInitialBillingItems(5);
      setBillingItems(loadedItems);

      setManualPrices(orderData.manualPrices || {});
      toast({
        title: "Order Loaded",
        description: `Order with No. ${slipNo} has been loaded.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Order not found",
        description: `No order found with No. ${slipNo}.`,
      });
    }
  }, [savedOrders, searchFilters.slipNo, toast]);


  return (
    <div className="flex flex-col min-h-screen">
       
        <BulkAddItemDialog onSave={addBulkItems} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isBulkAddOpen} onOpenChange={setIsBulkAddOpen} />

      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard"><ArrowLeft/></Link>
            </Button>
            <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Create Order</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/orders">
                <BookOpen className="mr-2 h-4 w-4" />
                All Orders
            </Link>
          </Button>
          {canEdit && (
            <>
              <Button onClick={() => setIsNewGroupOpen(true)} variant="outline"><Layers className="mr-2 h-4 w-4" />New Group</Button>
              <Button onClick={() => setIsBulkAddOpen(true)}><PackagePlus className="mr-2 h-4 w-4" />Bulk Add Items</Button>
               <Button onClick={() => setIsNewItemOpen(true)} variant="outline"><PackagePlus className="mr-2 h-4 w-4" />New Item</Button>
               <Button onClick={() => setIsNewPartyOpen(true)} variant="outline"><UserPlus className="mr-2 h-4 w-4" />New Party</Button>
              <Button variant="outline" onClick={handleSaveOrder}>
                <Save className="mr-2 h-4 w-4" />
                Save Order
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 md:p-6">
        <div className="lg:col-span-5">
            <OrderSearchFilters 
            parties={parties || []}
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            onLoadOrder={() => handleLoadOrder()}
            canEdit={!!canEdit}
            />
        </div>
        <div className="lg:col-span-3">
            <MainBillingTable 
            billingItems={billingItems}
            items={items || []}
            onAddRow={addBillingItem}
            onItemChange={handleBillingItemChange}
            onRemoveRow={removeBillingItem}
            canEdit={!!canEdit}
            />
        </div>
        <div className="lg:col-span-2">
            <TotalsSummary 
            billingItems={billingItems} 
            items={items || []}
            manualPrices={manualPrices}
            onManualPriceChange={handleManualPriceChange}
            canEdit={!!canEdit}
            />
        </div>
      </main>
      <NewItemDialog onSave={addItem} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isNewItemOpen} onOpenChange={setIsNewItemOpen} />
      <NewPartyDialog onSave={addParty} isOpen={isNewPartyOpen} onOpenChange={setIsNewPartyOpen} />
      <NewItemGroupDialog onSave={addItemGroup} isOpen={isNewGroupOpen} onOpenChange={setIsNewGroupOpen} />
    </div>
  );
}

export default function OrderDashboard(props: OrderDashboardProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDashboardContent {...props} />
    </Suspense>
  )
}
