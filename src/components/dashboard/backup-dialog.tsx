
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Item, Party, SavedBill } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { format } from "date-fns";

interface BackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    parties: Party[];
    items: Item[];
    savedBills: Record<string, SavedBill>;
  }
}

export function BackupDialog({ isOpen, onClose, data }: BackupDialogProps) {
  const [includeParties, setIncludeParties] = useState(true);
  const [includeItems, setIncludeItems] = useState(true);
  const [includeSavedBills, setIncludeSavedBills] = useState(true);
  const { toast } = useToast();

  const handleDownload = () => {
    const backupData: any = {};

    if (includeParties) {
        backupData.parties = data.parties;
    }
    if (includeItems) {
        backupData.items = data.items;
    }
    if (includeSavedBills) {
        backupData.savedBills = data.savedBills;
    }

    if (Object.keys(backupData).length === 0) {
        toast({
            variant: "destructive",
            title: "Nothing to Backup",
            description: "Please select at least one data type to back up.",
        });
        return;
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = format(new Date(), 'yyyy-MM-dd');
    link.download = `billtrack-pro-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
        title: "Backup Created",
        description: "Your backup file has been downloaded.",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup Your Data</DialogTitle>
          <DialogDescription>
            Select the data you want to include in the JSON backup file. This file can be used later to restore your data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="includeParties" checked={includeParties} onCheckedChange={(checked) => setIncludeParties(!!checked)} />
                <Label htmlFor="includeParties" className="font-medium">
                    Backup All Parties ({data.parties.length} records)
                </Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="includeItems" checked={includeItems} onCheckedChange={(checked) => setIncludeItems(!!checked)} />
                <Label htmlFor="includeItems" className="font-medium">
                    Backup All Items ({data.items.length} records)
                </Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="includeSavedBills" checked={includeSavedBills} onCheckedChange={(checked) => setIncludeSavedBills(!!checked)} />
                <Label htmlFor="includeSavedBills" className="font-medium">
                    Backup All Saved Bills ({Object.keys(data.savedBills).length} records)
                </Label>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
