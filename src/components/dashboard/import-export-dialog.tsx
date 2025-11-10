
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Item, Party, SavedBill } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useFirestore, useUser } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parties: Party[];
  items: Item[];
  onImportParties: (parties: Omit<Party, 'id'>[]) => void;
  onImportItems: (items: Omit<Item, 'id' | 'price' | 'balance'>[]) => void;
  canEdit: boolean;
}

export function ImportExportDialog({ 
    isOpen, 
    onClose, 
    parties = [], 
    items = [], 
    onImportParties, 
    onImportItems, 
    canEdit 
}: ImportExportDialogProps) {
  const [includeParties, setIncludeParties] = useState(true);
  const [includeItems, setIncludeItems] = useState(true);
  const [includeSavedBills, setIncludeSavedBills] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const partyFileInputRef = useRef<HTMLInputElement>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    toast({ title: 'Starting Export...', description: 'Preparing your data for download.' });
    
    const workbook = XLSX.utils.book_new();

    if (includeParties && parties.length > 0) {
      const partiesSheet = XLSX.utils.json_to_sheet(parties.map(({id, ...rest}) => rest));
      XLSX.utils.book_append_sheet(workbook, partiesSheet, "Parties");
    }
    if (includeItems && items.length > 0) {
      const itemsSheet = XLSX.utils.json_to_sheet(items.map(({id, price, ...rest}) => rest));
      XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");
    }
    if (includeSavedBills) {
      if (firestore && user) {
        toast({ title: 'Fetching Bills...', description: 'This may take a moment for large datasets.' });
        try {
            const billingRecordsQuery = collection(firestore, 'billingRecords');
            const querySnapshot = await getDocs(billingRecordsQuery);
            const savedBills = querySnapshot.docs.map(doc => doc.data() as SavedBill);

            if (savedBills.length > 0) {
                const billsData = savedBills.map(bill => ({
                    slipNo: bill.filters.slipNo,
                    date: bill.filters.date ? format(new Date(bill.filters.date), 'yyyy-MM-dd') : '',
                    partyName: bill.filters.partyName,
                    address: bill.filters.address,
                    vehicleNo: bill.filters.vehicleNo,
                    vehicleType: bill.filters.vehicleType,
                    billType: bill.filters.billType,
                    notes: bill.filters.notes,
                    billingItems: JSON.stringify(bill.billingItems),
                    manualPrices: JSON.stringify(bill.manualPrices),
                }));
                const billsSheet = XLSX.utils.json_to_sheet(billsData);
                XLSX.utils.book_append_sheet(workbook, billsSheet, "Saved Bills");
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Failed to Fetch Bills",
                description: "Could not export saved bills. Please check your connection and permissions.",
            });
        }
      }
    }
    
    setIsExporting(false);

    if (workbook.SheetNames.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to Export",
        description: "Please select at least one data type with records to export.",
      });
      return;
    }
    
    const date = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `BillTrack-Pro-Backup-${date}.xlsx`);

    toast({
        title: "Export Successful",
        description: "Your data has been exported to an Excel file.",
    });

    onClose();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>, type: 'parties' | 'items') => {
    if (!canEdit) {
        toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to import data." });
        return;
    }
     const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const fileData = e.target?.result;
            const workbook = XLSX.read(fileData, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<any>(worksheet);

            if (type === 'parties') {
                if (!json.every(row => typeof row.name === 'string' && typeof row.station === 'string')) {
                    throw new Error("Invalid party data. Each row must have a 'name' and 'station' column.");
                }
                const partiesToUpload = json.map(p => ({ name: p.name, address: p.address || '', district: p.district || '', state: p.state || '', pincode: p.pincode || '', station: p.station || '', phone: p.phone || '' }));
                onImportParties(partiesToUpload);
            } else if (type === 'items') {
                if (!json.every(row => typeof row.name === 'string' && typeof row.group === 'string' && typeof row.unit === 'string')) {
                     throw new Error("Invalid item data. Each row must have 'name', 'group', and 'unit' columns.");
                }
                const itemsToUpload = json.map(i => ({ name: i.name, group: i.group, unit: i.unit, alias: i.alias || '', balance: i.balance || 0 }));
                onImportItems(itemsToUpload);
            }

        } catch (error) {
             toast({
                variant: "destructive",
                title: "Import Failed",
                description: error instanceof Error ? error.message : "Could not read or parse the selected file.",
            });
        } finally {
            if (event.target) event.target.value = "";
        }
    };
    reader.readAsBinaryString(file);
  }

  const downloadTemplate = (type: 'parties' | 'items') => {
    const workbook = XLSX.utils.book_new();
    let data, sheetName, fileName;

    if (type === 'parties') {
        data = [{ name: 'Example Party', address: '123 Example St', district: 'Anytown', state: 'State', pincode: '123456', station: 'Central', phone: '555-1234' }];
        sheetName = 'Parties';
        fileName = 'party-template.xlsx';
    } else {
        data = [{ name: 'Example Item', group: 'Example Group', unit: 'PCS', alias: 'EX01', balance: 100 }];
        sheetName = 'Items';
        fileName = 'item-template.xlsx';
    }

    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import & Export Data</DialogTitle>
          <DialogDescription>
            Manage your application data by exporting to or importing from Excel files.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="export">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="import" disabled={!canEdit}>Import</TabsTrigger>
            </TabsList>
            <TabsContent value="export" className="pt-4">
                <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-muted-foreground">Select the data you want to export to a single Excel file.</p>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeParties" checked={includeParties} onCheckedChange={(checked) => setIncludeParties(!!checked)} />
                        <Label htmlFor="includeParties" className="font-medium">
                            Export Parties ({parties.length} records)
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeItems" checked={includeItems} onCheckedChange={(checked) => setIncludeItems(!!checked)} />
                        <Label htmlFor="includeItems" className="font-medium">
                            Export Items ({items.length} records)
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeSavedBills" checked={includeSavedBills} onCheckedChange={(checked) => setIncludeSavedBills(!!checked)} />
                        <Label htmlFor="includeSavedBills" className="font-medium">
                            Export Saved Bills
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Exporting...' : 'Export to Excel'}
                    </Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="import" className="pt-4">
                <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Import Parties</h4>
                        <p className="text-sm text-muted-foreground mb-4">Upload an Excel file with new parties. Duplicates based on name and station will be skipped.</p>
                        <div className="flex gap-2">
                            <input type="file" ref={partyFileInputRef} onChange={(e) => handleFileImport(e, 'parties')} className="hidden" accept=".xlsx, .xls, .csv" />
                            <Button className="flex-1" onClick={() => partyFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Upload Party File</Button>
                            <Button variant="secondary" onClick={() => downloadTemplate('parties')}>Download Template</Button>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Import Items</h4>
                        <p className="text-sm text-muted-foreground mb-4">Upload an Excel file to add new items. Existing items will not be affected.</p>
                        <div className="flex gap-2">
                            <input type="file" ref={itemFileInputRef} onChange={(e) => handleFileImport(e, 'items')} className="hidden" accept=".xlsx, .xls, .csv" />
                            <Button className="flex-1" onClick={() => itemFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Upload Item File</Button>
                            <Button variant="secondary" onClick={() => downloadTemplate('items')}>Download Template</Button>
                        </div>
                    </div>
                </div>
                 <DialogFooter className="pt-6">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    