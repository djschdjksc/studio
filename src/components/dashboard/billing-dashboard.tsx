
"use client";

import { NewItemDialog } from "@/components/dashboard/new-item-dialog";
import { NewPartyDialog } from "@/components/dashboard/new-party-dialog";
import SearchFilters from "@/components/dashboard/search-filters";
import MainBillingTable from "@/components/dashboard/main-billing-table";
import TotalsSummary from "@/components/dashboard/totals-summary";
import React, { useState, useEffect, useCallback } from "react";
import { Party, Item, BillingItem, SearchFiltersState, SavedBill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Save, BookOpen, FileUp, PackagePlus } from "lucide-react";
import { NewItemGroupDialog } from "./new-item-group-dialog";
import { BillPreviewDialog } from "./bill-preview-dialog";
import { AllBillsDialog } from "./all-bills-dialog";
import { useToast } from "@/hooks/use-toast";
import { BulkAddItemDialog } from "./bulk-add-item-dialog";

const defaultParties: Party[] = [];
const defaultItemGroups: string[] = [];
const defaultItems: Item[] = [];

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
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<string[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>(generateInitialBillingItems(5));
  const [isLoaded, setIsLoaded] = useState(false);
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [searchFilters, setSearchFilters] = useState<SearchFiltersState>({
    ...initialFilters,
    date: new Date(),
  });
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isAllBillsOpen, setIsAllBillsOpen] = useState(false);
  const [savedBills, setSavedBills] = useState<Record<string, SavedBill>>({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedParties = localStorage.getItem("parties");
      const savedItems = localStorage.getItem("items");
      const savedItemGroups = localStorage.getItem("itemGroups");
      const loadedSavedBills = localStorage.getItem("savedBills");

      setParties(savedParties ? JSON.parse(savedParties) : defaultParties);
      setItems(savedItems ? JSON.parse(savedItems) : defaultItems);
      setItemGroups(savedItemGroups ? JSON.parse(savedItemGroups) : defaultItemGroups);
      
      const parsedSavedBills = loadedSavedBills ? JSON.parse(loadedSavedBills) : {};
      setSavedBills(parsedSavedBills);

      const slipNumbers = Object.keys(parsedSavedBills).map(Number).filter(n => !isNaN(n));
      const nextSlipNo = slipNumbers.length > 0 ? String(Math.max(...slipNumbers) + 1) : "1";
      setSearchFilters(prev => ({...prev, slipNo: nextSlipNo}));
      
    } catch (error) {
      console.error("Failed to parse from local storage", error);
      setParties(defaultParties);
      setItems(defaultItems);
      setItemGroups(defaultItemGroups);
      setSavedBills({});
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("parties", JSON.stringify(parties));
    }
  }, [parties, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("items", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("itemGroups", JSON.stringify(itemGroups));
    }
  }, [itemGroups, isLoaded]);

  useEffect(() => {
    if(isLoaded) {
        localStorage.setItem("savedBills", JSON.stringify(savedBills));
    }
  }, [savedBills, isLoaded]);

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
    setParties(prev => [...prev, { ...party, id: String(prev.length + 1) }]);
  };

  const addItem = (item: Omit<Item, 'id' | 'price'>) => {
    setItems(prev => [...prev, { ...item, id: String(prev.length + 1), price: 0 }]);
  };
  
  const addBulkItems = (newItems: Omit<Item, 'id' | 'price' | 'alias'>[]) => {
    const itemsToAdd = newItems.map((item, index) => ({
      ...item,
      id: String(items.length + index + 1),
      price: 0,
      alias: ""
    }));
    setItems(prev => [...prev, ...itemsToAdd]);
  };

  const addItemGroup = (groupName: string) => {
    if (groupName && !itemGroups.includes(groupName)) {
      setItemGroups(prev => [...prev, groupName]);
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

  const handleSaveBill = () => {
    if (!searchFilters.slipNo) {
      toast({
        variant: "destructive",
        title: "Slip No. required",
        description: "Please enter a Slip No. before saving.",
      });
      return;
    }

    const billData = {
      filters: { ...searchFilters, date: searchFilters.date ? new Date(searchFilters.date).toISOString() : new Date().toISOString() },
      billingItems,
      manualPrices
    };

    const newSavedBills = {
        ...savedBills,
        [searchFilters.slipNo]: billData
    };
    
    setSavedBills(newSavedBills);

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

  return (
    <div className="flex flex-col min-h-screen">
       <BillPreviewDialog 
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          filters={searchFilters}
          billingItems={billingItems}
          items={items}
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
          onDeleteBill={(slipNo) => {
            const newSavedBills = { ...savedBills };
            delete newSavedBills[slipNo];
            setSavedBills(newSavedBills);
            toast({
                title: "Bill Deleted",
                description: `Bill with Slip No. ${slipNo} has been deleted.`,
            });
          }}
          items={items}
       />
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAllBillsOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            All Bills
          </Button>
          <NewItemGroupDialog onSave={addItemGroup} />
          <BulkAddItemDialog onSave={addBulkItems} itemGroups={itemGroups} />
          <NewItemDialog onSave={addItem} itemGroups={itemGroups} />
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
          parties={parties}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onLoadBill={() => handleLoadBill()}
         />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <MainBillingTable 
              billingItems={billingItems}
              items={items}
              onAddRow={addBillingItem}
              onItemChange={handleBillingItemChange}
              onRemoveRow={removeBillingItem}
            />
          </div>
          <div className="lg:col-span-2">
            <TotalsSummary 
              billingItems={billingItems} 
              items={items}
              manualPrices={manualPrices}
              onManualPriceChange={handleManualPriceChange}
             />
          </div>
        </div>
      </main>
    </div>
  );
}
