
"use client";

import { NewItemDialog } from "@/components/dashboard/new-item-dialog";
import { NewPartyDialog } from "@/components/dashboard/new-party-dialog";
import SearchFilters from "@/components/dashboard/search-filters";
import MainBillingTable from "@/components/dashboard/main-billing-table";
import TotalsSummary from "@/components/dashboard/totals-summary";
import React, { useState, useEffect, useCallback } from "react";
import { Party, Item, BillingItem, SearchFiltersState, SavedBill, WithId, ItemGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BookOpen, FileUp, PackagePlus, Save, DatabaseBackup } from "lucide-react";
import { NewItemGroupDialog } from "./new-item-group-dialog";
import { BillPreviewDialog } from "./bill-preview-dialog";
import { AllBillsDialog } from "./all-bills-dialog";
import { useToast } from "@/hooks/use-toast";
import { BulkAddItemDialog } from "./bulk-add-item-dialog";
import { UploadPartyJson } from "./upload-party-json";
import { UploadItemJson } from "./upload-item-json";
import { BackupDialog } from "./backup-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, writeBatch, setDoc, deleteDoc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

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


export default function BillingDashboard() {
  const firestore = useFirestore();

  const partiesQuery = useMemoFirebase(() => collection(firestore, 'parties'), [firestore]);
  const { data: parties, isLoading: partiesLoading } = useCollection<Party>(partiesQuery);

  const itemsQuery = useMemoFirebase(() => collection(firestore, 'items'), [firestore]);
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  const itemGroupsQuery = useMemoFirebase(() => collection(firestore, 'itemGroups'), [firestore]);
  const { data: itemGroups, isLoading: itemGroupsLoading } = useCollection<ItemGroup>(itemGroupsQuery);

  const savedBillsQuery = useMemoFirebase(() => collection(firestore, 'billingRecords'), [firestore]);
  const { data: savedBills, isLoading: billsLoading } = useCollection<SavedBill>(savedBillsQuery);


  const [billingItems, setBillingItems] = useState<BillingItem[]>(generateInitialBillingItems(5));
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [searchFilters, setSearchFilters] = useState<SearchFiltersState>({
    ...initialFilters,
    date: new Date(),
  });
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isAllBillsOpen, setIsAllBillsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const { toast } = useToast();

  const isLoaded = !partiesLoading && !itemsLoading && !itemGroupsLoading && !billsLoading;

  useEffect(() => {
    if (savedBills) {
      const slipNumbers = savedBills.map(bill => Number(bill.filters.slipNo)).filter(n => !isNaN(n));
      const nextSlipNo = slipNumbers.length > 0 ? String(Math.max(...slipNumbers) + 1) : "1";
      setSearchFilters(prev => ({...prev, slipNo: nextSlipNo}));
    }
  }, [savedBills]);

  const clearForm = useCallback((nextSlipNo: string) => {
    setBillingItems(generateInitialBillingItems(5));
    setManualPrices({});
    setSearchFilters(prev => ({
        ...initialFilters,
        date: prev.date, // Keep the same date
        slipNo: nextSlipNo,
    }));
  }, []);


  const addParty = (party: Omit<Party, 'id'>) => {
    const partyRef = doc(collection(firestore, 'parties'));
    addDocumentNonBlocking(collection(firestore, 'parties'), { ...party, id: partyRef.id });
  };
  
  const handlePartyUpload = async (uploadedParties: Omit<Party, 'id'>[]) => {
    const batch = writeBatch(firestore);
    parties?.forEach(party => {
        const docRef = doc(firestore, 'parties', party.id);
        batch.delete(docRef);
    });
    uploadedParties.forEach(party => {
        const docRef = doc(collection(firestore, 'parties'));
        batch.set(docRef, { ...party, id: docRef.id });
    });
    await batch.commit();
     toast({
        title: "Parties Restored!",
        description: `Restored ${uploadedParties.length} parties. Old data has been replaced.`,
    });
  }

  const addItem = (item: Omit<Item, 'id' | 'price'>) => {
    const itemRef = doc(collection(firestore, 'items'));
    addDocumentNonBlocking(collection(firestore, 'items'), { ...item, id: itemRef.id, price: 0 });
  };
  
  const addBulkItems = async (newItems: Omit<Item, 'id' | 'price'>[]) => {
    const batch = writeBatch(firestore);
    newItems.forEach(item => {
        const docRef = doc(collection(firestore, 'items'));
        batch.set(docRef, { ...item, id: docRef.id, price: 0 });
    });
    await batch.commit();
    toast({
      title: "Items Added!",
      description: `${newItems.length} new items have been added.`,
    });
  };

  const handleItemUpload = async (uploadedItems: Omit<Item, 'id' | 'price'>[]) => {
    const batch = writeBatch(firestore);
    items?.forEach(item => {
        const docRef = doc(firestore, 'items', item.id);
        batch.delete(docRef);
    });
    uploadedItems.forEach(item => {
        const docRef = doc(collection(firestore, 'items'));
        batch.set(docRef, { ...item, id: docRef.id, price: 0 });
    });
    await batch.commit();
    toast({
        title: "Items Restored!",
        description: `Restored ${uploadedItems.length} items. Old data has been replaced.`,
    });
  };

  const addItemGroup = (groupName: string) => {
    if (groupName && !itemGroups?.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
       const groupRef = doc(collection(firestore, 'itemGroups'));
       setDocumentNonBlocking(groupRef, { name: groupName, id: groupRef.id }, {});
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

    if (field === 'itemName') {
      const selectedItem = items?.find(i => i.name.toLowerCase() === String(value).toLowerCase());
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

  const handleSaveBill = () => {
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
    const billData = savedBills?.find(b => b.filters.slipNo === slipNo);

    if (billData) {
      const loadedFilters = {
        ...billData.filters,
        date: billData.filters.date ? new Date(billData.filters.date) : new Date(),
      };
      setSearchFilters(loadedFilters);
      setBillingItems(billData.billingItems);
      setManualPrices(billData.manualPrices);
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
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const savedBillsAsRecord: Record<string, WithId<SavedBill>> = (savedBills || []).reduce((acc, bill) => {
    acc[bill.filters.slipNo] = bill;
    return acc;
  }, {} as Record<string, WithId<SavedBill>>);


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
          savedBills={savedBillsAsRecord}
          onLoadBill={(slipNo) => {
            handleLoadBill(slipNo);
            setIsAllBillsOpen(false);
          }}
          onDeleteBill={(slipNo) => {
            const billToDelete = savedBills?.find(b => b.filters.slipNo === slipNo);
            if (billToDelete) {
              deleteDocumentNonBlocking(doc(firestore, 'billingRecords', billToDelete.id));
              toast({
                  title: "Bill Deleted",
                  description: `Bill with Slip No. ${slipNo} has been deleted.`,
              });
            }
          }}
          items={items || []}
       />
        <BackupDialog
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          data={{ parties: parties || [], items: items || [], savedBills: savedBillsAsRecord }}
        />
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro</h1>
        <div className="flex items-center gap-2">
          <UploadPartyJson onUpload={handlePartyUpload} />
          <UploadItemJson onUpload={handleItemUpload} />
          <Button variant="outline" onClick={() => setIsBackupOpen(true)}>
            <DatabaseBackup className="mr-2 h-4 w-4" />
            Backup Data
          </Button>
          <Button variant="outline" onClick={() => setIsAllBillsOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            All Bills
          </Button>
          <NewItemGroupDialog onSave={addItemGroup} />
          <BulkAddItemDialog onSave={addBulkItems} itemGroups={(itemGroups || []).map(g => g.name)} />
          <NewItemDialog onSave={addItem} itemGroups={(itemGroups || []).map(g => g.name)} />
          <NewPartyDialog onSave={addParty} />
          <Button variant="outline" onClick={handleSaveBill}>
            <Save className="mr-2 h-4 w-4" />
            Save Bill
          </Button>
          <Button onClick={() => setIsBillPreviewOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Preview Bill
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <SearchFilters 
          parties={parties || []}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onLoadBill={() => handleLoadBill()}
         />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <MainBillingTable 
              billingItems={billingItems}
              items={items || []}
              onAddRow={addBillingItem}
              onItemChange={handleBillingItemChange}
              onRemoveRow={removeBillingItem}
            />
          </div>
          <div className="lg:col-span-2">
            <TotalsSummary 
              billingItems={billingItems} 
              items={items || []}
              manualPrices={manualPrices}
              onManualPriceChange={handleManualPriceChange}
             />
          </div>
        </div>
      </main>
    </div>
  );
}
