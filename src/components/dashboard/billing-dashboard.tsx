'use client';

import { NewItemDialog } from '@/components/dashboard/new-item-dialog';
import { NewPartyDialog } from '@/components/dashboard/new-party-dialog';
import SearchFilters from '@/components/dashboard/search-filters';
import MainBillingTable from '@/components/dashboard/main-billing-table';
import TotalsSummary from '@/components/dashboard/totals-summary';
import React, { useState, useEffect, useCallback } from 'react';
import { Party, Item, BillingItem, SearchFiltersState, SavedBill, WithId, ItemGroup, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BookOpen, FileUp, Save, Import, LogOut, Shield } from 'lucide-react';
import { NewItemGroupDialog } from './new-item-group-dialog';
import { BillPreviewDialog } from './bill-preview-dialog';
import { AllBillsDialog } from './all-bills-dialog';
import { useToast } from '@/hooks/use-toast';
import { BulkAddItemDialog } from './bulk-add-item-dialog';
import { ImportExportDialog } from './import-export-dialog';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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

const initialFilters: Omit<SearchFiltersState, 'date'> = {
    partyName: "",
    address: "",
    slipNo: "",
    vehicleNo: "",
    vehicleType: "",
    billType: "sale",
    notes: "",
};

interface BillingDashboardProps {
  userProfile: UserProfile;
}


export default function BillingDashboard({ userProfile }: BillingDashboardProps) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const canEdit = userProfile.role === 'editor' || userProfile.role === 'manager' || userProfile.role === 'admin' || userProfile.role === 'owner';
  const canDelete = userProfile.role === 'manager' || userProfile.role === 'admin' || userProfile.role === 'owner';
  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'owner';

  const partiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'parties') : null, [firestore]);
  const { data: parties } = useCollection<Party>(partiesQuery);

  const itemsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'items') : null, [firestore]);
  const { data: items } = useCollection<Item>(itemsQuery);

  const itemGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'itemGroups') : null, [firestore]);
  const { data: itemGroups } = useCollection<ItemGroup>(itemGroupsQuery);

  const billingRecordsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'billingRecords') : null, [firestore]);
  const { data: savedBillsData } = useCollection<SavedBill>(billingRecordsQuery);

  const [billingItems, setBillingItems] = useState<BillingItem[]>(generateInitialBillingItems(5));
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [searchFilters, setSearchFilters] = useState<SearchFiltersState>({
    ...initialFilters,
    date: new Date(),
  });
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isAllBillsOpen, setIsAllBillsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isNewPartyOpen, setIsNewPartyOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);


  const savedBills = React.useMemo(() => {
    if (!savedBillsData) return {};
    return savedBillsData.reduce((acc, bill) => {
        if(bill.filters.slipNo) {
            acc[bill.filters.slipNo] = bill;
        }
        return acc;
    }, {} as Record<string, WithId<SavedBill>>)
  }, [savedBillsData]);


  useEffect(() => {
    if(!canEdit) return;
    const slipNumbers = Object.values(savedBills).map(bill => Number(bill.filters.slipNo)).filter(n => !isNaN(n));
    const nextSlipNo = slipNumbers.length > 0 ? String(Math.max(...slipNumbers) + 1) : "1";
    setSearchFilters(prev => ({...prev, slipNo: nextSlipNo}));
  }, [savedBills, canEdit]);

  const clearForm = useCallback((nextSlipNo: string) => {
    setBillingItems(generateInitialBillingItems(5));
    setManualPrices({});
    setSearchFilters(prev => ({
        ...initialFilters,
        date: prev.date, // Keep the same date
        slipNo: nextSlipNo,
    }));
  }, []);


  const addParty = async (party: Omit<Party, 'id'>) => {
    if (!canEdit || !firestore) return;
    const newDocRef = doc(collection(firestore, 'parties'));
    setDocumentNonBlocking(newDocRef, party, {});
    toast({ title: 'Party Added', description: `Added ${party.name}.` });
  };
  
  const handlePartyUpload = async (uploadedParties: Omit<Party, 'id'>[]) => {
    if (!canEdit || !firestore || !parties) return;
    for (const p of parties) {
        deleteDocumentNonBlocking(doc(firestore, 'parties', p.id));
    }
    for (const p of uploadedParties) {
        const newDocRef = doc(collection(firestore, 'parties'));
        setDocumentNonBlocking(newDocRef, p, {});
    }
     toast({
        title: "Parties Restored!",
        description: `Restored ${uploadedParties.length} parties. Old data has been replaced.`,
    });
  }

  const addItem = async (item: Omit<Item, 'id' | 'price'>) => {
    if (!canEdit || !firestore) return;
    const newDocRef = doc(collection(firestore, 'items'));
    setDocumentNonBlocking(newDocRef, {...item, price: 0}, {});
    toast({ title: 'Item Added', description: `Added ${item.name}.` });
  };
  
  const addBulkItems = async (newItems: Omit<Item, 'id' | 'price'>[]) => {
    if (!canEdit || !firestore) return;
    for (const item of newItems) {
        const newDocRef = doc(collection(firestore, 'items'));
        setDocumentNonBlocking(newDocRef, {...item, price: 0}, {});
    }
    toast({
      title: "Items Added!",
      description: `${newItems.length} new items have been added.`,
    });
  };

  const handleItemUpload = async (uploadedItems: Omit<Item, 'id' | 'price'>[]) => {
    if (!canEdit || !firestore || !items) return;
    for (const i of items) {
        deleteDocumentNonBlocking(doc(firestore, 'items', i.id));
    }
    for (const item of uploadedItems) {
        const newDocRef = doc(collection(firestore, 'items'));
        setDocumentNonBlocking(newDocRef, {...item, price: 0}, {});
    }
    toast({
        title: "Items Restored!",
        description: `Restored ${uploadedItems.length} items. Old data has been replaced.`,
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

  const handleSaveBill = async () => {
    if (!canEdit || !firestore) return;
    if (!searchFilters.slipNo) {
      toast({
        variant: "destructive",
        title: "Slip No. required",
        description: "Please enter a Slip No. before saving.",
      });
      return;
    }

    const billData: Omit<SavedBill, 'id'> = {
      filters: { ...searchFilters, date: searchFilters.date ? new Date(searchFilters.date).toISOString() : new Date().toISOString() },
      billingItems: billingItems.filter(item => item.itemName && item.quantity),
      manualPrices
    };
    
    const docRef = doc(firestore, 'billingRecords', searchFilters.slipNo);
    setDocumentNonBlocking(docRef, billData, {});

    toast({
        title: "Bill Saved!",
        description: `Bill with Slip No. ${searchFilters.slipNo} has been saved successfully.`,
    });

    const currentSlipNo = Number(searchFilters.slipNo);
    const nextSlipNo = isNaN(currentSlipNo) ? "" : String(currentSlipNo + 1);

    clearForm(nextSlipNo);
  }

  const handleLoadBill = (slipNoToLoad?: string) => {
    const slipNo = slipNoToLoad || searchFilters.slipNo;

    if(!slipNo) {
        toast({
            variant: "destructive",
            title: "Slip No. required",
            description: "Please enter a Slip No. to load a bill.",
        });
        return;
    }
    const billData = savedBills[slipNo];

    if (billData) {
      const loadedFilters = {
        ...billData.filters,
        date: billData.filters.date ? new Date(billData.filters.date) : new Date(),
      };
      setSearchFilters(loadedFilters);
      
      const loadedItems = billData.billingItems.length > 0 ? billData.billingItems : generateInitialBillingItems(5);
      setBillingItems(loadedItems);

      setManualPrices(billData.manualPrices || {});
      toast({
        title: "Bill Loaded",
        description: `Bill with Slip No. ${slipNo} has been loaded.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Bill not found",
        description: `No bill found with Slip No. ${slipNo}.`,
      });
    }
  };
  
  const handleDeleteBill = async (slipNo: string) => {
    if (!canDelete || !firestore) return;
    const docRef = doc(firestore, 'billingRecords', slipNo);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Bill Deleted",
        description: `Bill with Slip No. ${slipNo} has been deleted.`,
    });
  }


  return (
    <div className="flex flex-col min-h-screen">
       <BillPreviewDialog 
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          filters={searchFilters}
          billingItems={billingItems}
          items={items || []}
          manualPrices={manualPrices}
       />
       <AllBillsDialog
          isOpen={isAllBillsOpen}
          onClose={() => setIsAllBillsOpen(false)}
          savedBills={savedBills}
          onLoadBill={(slipNo) => {
            handleLoadBill(slipNo);
            setIsAllBillsOpen(false);
          }}
          onDeleteBill={handleDeleteBill}
          items={items || []}
          canDelete={canDelete}
       />
        <ImportExportDialog
          isOpen={isImportExportOpen}
          onClose={() => setIsImportExportOpen(false)}
          data={{ parties: parties || [], items: items || [], savedBills: Object.values(savedBills) }}
          onImportParties={handlePartyUpload}
          onImportItems={handleItemUpload}
          canEdit={canEdit}
        />
        <NewItemDialog onSave={addItem} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isNewItemOpen} onOpenChange={setIsNewItemOpen} />
        <NewPartyDialog onSave={addParty} isOpen={isNewPartyOpen} onOpenChange={setIsNewPartyOpen} />
        <NewItemGroupDialog onSave={addItemGroup} isOpen={isNewGroupOpen} onOpenChange={setIsNewGroupOpen} />
        <BulkAddItemDialog onSave={addBulkItems} itemGroups={(itemGroups || []).map(g => g.name)} isOpen={isBulkAddOpen} onOpenChange={setIsBulkAddOpen} />

      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro</h1>
            <span className="text-sm text-muted-foreground capitalize">({userProfile.role})</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
                <Button variant="secondary" asChild>
                    <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                </Button>
            )}
          {canEdit && (
            <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
                <Import className="mr-2 h-4 w-4" />
                Import/Export
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAllBillsOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            All Bills
          </Button>
          {canEdit && (
            <>
              <NewItemGroupDialog onSave={addItemGroup} />
              <BulkAddItemDialog onSave={addBulkItems} itemGroups={(itemGroups || []).map(g => g.name)} />
              <NewItemDialog onSave={addItem} itemGroups={(itemGroups || []).map(g => g.name)} />
              <NewPartyDialog onSave={addParty} />
              <Button variant="outline" onClick={handleSaveBill}>
                <Save className="mr-2 h-4 w-4" />
                Save Bill
              </Button>
            </>
          )}
          <Button onClick={() => setIsBillPreviewOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Preview Bill
          </Button>
          <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <SearchFilters 
          parties={parties || []}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onLoadBill={() => handleLoadBill()}
          canEdit={canEdit}
         />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <MainBillingTable 
              billingItems={billingItems}
              items={items || []}
              onAddRow={addBillingItem}
              onItemChange={handleBillingItemChange}
              onRemoveRow={removeBillingItem}
              canEdit={canEdit}
            />
          </div>
          <div className="lg:col-span-2">
            <TotalsSummary 
              billingItems={billingItems} 
              items={items || []}
              manualPrices={manualPrices}
              onManualPriceChange={handleManualPriceChange}
              canEdit={canEdit}
             />
          </div>
        </div>
      </main>
    </div>
  );
}
