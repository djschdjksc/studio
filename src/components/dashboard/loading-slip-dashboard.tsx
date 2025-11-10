'use client';

import { NewItemDialog } from '@/components/dashboard/new-item-dialog';
import { NewPartyDialog } from '@/components/dashboard/new-party-dialog';
import LoadingSlipSearchFilters from '@/components/dashboard/loading-slip-search-filters';
import MainBillingTable from '@/components/dashboard/main-billing-table';
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Party, Item, BillingItem, LoadingSlipFiltersState, SavedLoadingSlip, WithId, ItemGroup, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BookOpen, Save, PackagePlus, UserPlus, Layers, ArrowLeft } from 'lucide-react';
import { NewItemGroupDialog } from './new-item-group-dialog';
import { useToast } from '@/hooks/use-toast';
import { BulkAddItemDialog } from './bulk-add-item-dialog';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useSearchParams } from 'next/navigation';

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

const initialFilters: Omit<LoadingSlipFiltersState, 'date'> = {
    partyName: "",
    address: "",
    slipNo: "",
    notes: "",
};

interface LoadingSlipDashboardProps {
  userProfile: UserProfile;
}

function LoadingSlipDashboardContent({ userProfile }: LoadingSlipDashboardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const canEdit = true;

  const partiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'parties') : null, [firestore]);
  const { data: parties } = useCollection<Party>(partiesQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: items } = useCollection<Item>(itemsQuery);

  const itemGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'itemGroups') : null, [firestore]);
  const { data: itemGroups } = useCollection<ItemGroup>(itemGroupsQuery);

  const loadingSlipsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'loadingSlips') : null, [firestore]);
  const { data: savedSlipsData } = useCollection<SavedLoadingSlip>(loadingSlipsQuery);

  const [billingItems, setBillingItems] = useState<BillingItem[]>(generateInitialBillingItems(5));
  const [searchFilters, setSearchFilters] = useState<LoadingSlipFiltersState>({
    ...initialFilters,
    date: new Date(),
  });

  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isNewPartyOpen, setIsNewPartyOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const savedSlips = React.useMemo(() => {
    if (!savedSlipsData) return {};
    return savedSlipsData.reduce((acc, slip) => {
        if(slip.filters.slipNo) {
            acc[slip.filters.slipNo] = slip;
        }
        return acc;
    }, {} as Record<string, WithId<SavedLoadingSlip>>)
  }, [savedSlipsData]);


  const handleLoadSlip = useCallback((slipNoToLoad?: string) => {
    const slipNo = slipNoToLoad || searchFilters.slipNo;

    if(!slipNo) {
        toast({
            variant: "destructive",
            title: "Slip No. required",
            description: "Please enter a Slip No. to load a slip.",
        });
        return;
    }
    const slipData = savedSlips[slipNo];

    if (slipData) {
      const loadedFilters = {
        ...slipData.filters,
        date: slipData.filters.date ? new Date(slipData.filters.date) : new Date(),
      };
      setSearchFilters(loadedFilters);
      
      const loadedItems = slipData.billingItems.length > 0 ? slipData.billingItems.map((item, index) => ({...item, srNo: index + 1})) : generateInitialBillingItems(5);
      setBillingItems(loadedItems);

      toast({
        title: "Slip Loaded",
        description: `Loading Slip No. ${slipNo} has been loaded.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Slip not found",
        description: `No loading slip found with No. ${slipNo}.`,
      });
    }
  }, [savedSlips, searchFilters.slipNo, toast]);


  useEffect(() => {
    if(!canEdit || !savedSlips) return;

    const slipNoFromUrl = searchParams.get('slipNo');
    if (slipNoFromUrl) {
      handleLoadSlip(slipNoFromUrl);
    } else {
      const slipNumbers = Object.values(savedSlips).map(slip => Number(slip.filters.slipNo)).filter(n => !isNaN(n));
      const nextSlipNo = slipNumbers.length > 0 ? String(Math.max(...slipNumbers) + 1) : "1";
      setSearchFilters(prev => ({...prev, slipNo: nextSlipNo}));
    }
  }, [savedSlips, canEdit, searchParams, handleLoadSlip]);

  const clearForm = useCallback((nextSlipNo: string) => {
    setBillingItems(generateInitialBillingItems(5));
    setSearchFilters(prev => ({
        ...initialFilters,
        date: prev.date, // Keep the same date
        slipNo: nextSlipNo,
    }));
  }, []);

  const addParty = async (party: Omit<Party, 'id'>) => {
    if (!firestore) return;
    const newDocRef = doc(collection(firestore, 'parties'));
    setDocumentNonBlocking(newDocRef, party, {});
    toast({ title: 'Party Added', description: `Added ${party.name}.` });
  };

  const addItem = async (item: Omit<Item, 'id' | 'price' | 'balance'>) => {
    if (!firestore) return;
    const newDocRef = doc(collection(firestore, 'items'));
    setDocumentNonBlocking(newDocRef, {...item, price: 0, balance: 0}, {});
    toast({ title: 'Item Added', description: `Added ${item.name}.` });
  };
  
  const addBulkItems = async (newItems: Omit<Item, 'id' | 'price' | 'balance'>[]) => {
    if (!firestore) return;
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
    if (!firestore) return;
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


  const handleSaveSlip = async () => {
    if (!firestore) return;
    if (!searchFilters.slipNo) {
      toast({
        variant: "destructive",
        title: "Slip No. required",
        description: "Please enter a Slip No. before saving.",
      });
      return;
    }
     if (!searchFilters.partyName) {
      toast({
        variant: 'destructive',
        title: 'Party Not Selected',
        description: 'Please select a party before saving.',
      });
      return;
    }

    const slipData: Omit<SavedLoadingSlip, 'id'> = {
      filters: { ...searchFilters, date: searchFilters.date ? new Date(searchFilters.date).toISOString() : new Date().toISOString() },
      billingItems: billingItems.filter(item => item.itemName && item.quantity),
    };
    
    // Save the slip
    const docRef = doc(firestore, 'loadingSlips', searchFilters.slipNo);
    setDocumentNonBlocking(docRef, slipData, {});

    toast({
        title: "Loading Slip Saved!",
        description: `Slip No. ${searchFilters.slipNo} has been saved successfully.`,
    });

    const currentSlipNo = Number(searchFilters.slipNo);
    const nextSlipNo = isNaN(currentSlipNo) ? "" : String(currentSlipNo + 1);

    clearForm(nextSlipNo);
  }

  const totalQuantity = useMemo(() => {
    return billingItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [billingItems]);


  return (
    <div className="flex flex-col min-h-screen">
       
        <BulkAddItemDialog onSave={addBulkItems} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isBulkAddOpen} onOpenChange={setIsBulkAddOpen} />

      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard"><ArrowLeft/></Link>
            </Button>
            <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Create Loading Slip</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/loading-slips">
                <BookOpen className="mr-2 h-4 w-4" />
                All Slips
            </Link>
          </Button>
          <>
            <Button onClick={() => setIsNewGroupOpen(true)} variant="outline"><Layers className="mr-2 h-4 w-4" />New Group</Button>
            <Button onClick={() => setIsBulkAddOpen(true)}><PackagePlus className="mr-2 h-4 w-4" />Bulk Add Items</Button>
            <Button onClick={() => setIsNewItemOpen(true)} variant="outline"><PackagePlus className="mr-2 h-4 w-4" />New Item</Button>
            <Button onClick={() => setIsNewPartyOpen(true)} variant="outline"><UserPlus className="mr-2 h-4 w-4" />New Party</Button>
            <Button variant="outline" onClick={handleSaveSlip}>
              <Save className="mr-2 h-4 w-4" />
              Save Slip
            </Button>
          </>
        </div>
      </header>
      <main className="flex-1 flex flex-col gap-4 p-4 md:p-6">
        <div >
            <LoadingSlipSearchFilters 
            parties={parties || []}
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            onLoadSlip={() => handleLoadSlip()}
            canEdit={canEdit}
            />
        </div>
        <div className="flex-grow">
            <MainBillingTable 
            billingItems={billingItems}
            items={items || []}
            onAddRow={addBillingItem}
            onItemChange={handleBillingItemChange}
            onRemoveRow={removeBillingItem}
            canEdit={canEdit}
            />
        </div>
        <div className="flex justify-end p-4 border-t bg-card">
             <div className="flex items-center gap-4 text-lg font-bold">
                <span>Total Quantity:</span>
                <span className="text-primary">{totalQuantity.toLocaleString('en-IN')}</span>
            </div>
        </div>
      </main>
      <NewItemDialog onSave={addItem} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isNewItemOpen} onOpenChange={setIsNewItemOpen} />
      <NewPartyDialog onSave={addParty} isOpen={isNewPartyOpen} onOpenChange={setIsNewPartyOpen} />
      <NewItemGroupDialog onSave={addItemGroup} isOpen={isNewGroupOpen} onOpenChange={setIsNewGroupOpen} />
    </div>
  );
}

export default function LoadingSlipDashboard(props: LoadingSlipDashboardProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoadingSlipDashboardContent {...props} />
    </Suspense>
  )
}
