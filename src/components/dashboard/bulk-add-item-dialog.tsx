
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Item } from "@/lib/types";
import { PackagePlus, PlusCircle, Trash2 } from "lucide-react";
import { useState, useId } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

type BulkItem = Omit<Item, 'id' | 'price'> & { tempId: string };

interface BulkAddItemDialogProps {
    onSave: (items: Omit<Item, 'id' | 'price'>[]) => void;
    itemGroups: string[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const createNewBulkItem = (tempId: string): BulkItem => ({
    tempId,
    name: "",
    group: "",
    unit: "",
    alias: "",
});

const unitOptions = ["PCS", "BOXE", "BUNDLE", "SQM", "MTR", "PKT"];

export function BulkAddItemDialog({ onSave, itemGroups, isOpen, onOpenChange }: BulkAddItemDialogProps) {
  const [items, setItems] = useState<BulkItem[]>([createNewBulkItem(crypto.randomUUID())]);
  const { toast } = useToast();
  const dialogId = useId();

  const handleItemChange = (tempId: string, field: keyof Omit<BulkItem, 'tempId'>, value: string) => {
    setItems(currentItems => 
        currentItems.map(item => 
            item.tempId === tempId ? {...item, [field]: value} : item
        )
    );
  };
  
  const handleAddRow = () => {
    setItems(currentItems => [...currentItems, createNewBulkItem(crypto.randomUUID())]);
  }

  const handleRemoveRow = (tempId: string) => {
    setItems(currentItems => {
      if(currentItems.length <= 1) return currentItems;
      return currentItems.filter(item => item.tempId !== tempId);
    });
  }

  const handleSave = () => {
    const validItems = items.map(item => ({...item})).filter(item => {
        return item.name.trim() && item.group.trim() && item.unit.trim();
    });

    if(validItems.length === 0) {
        toast({
            variant: "destructive",
            title: "No Valid Items",
            description: "Please fill out at least one complete item row (Name, Group, and Unit are required).",
        });
        return;
    }
    
    const itemsToSave = validItems.map(({tempId, ...rest}) => rest);

    onSave(itemsToSave);
    
    setItems([createNewBulkItem(crypto.randomUUID())]);
    onOpenChange(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent, tempId: string, fieldName: 'name' | 'group' | 'unit' | 'alias') => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const fieldOrder: ('name' | 'group' | 'unit' | 'alias')[] = ['name', 'group', 'unit', 'alias'];
    const currentIndex = fieldOrder.indexOf(fieldName);
    
    if (currentIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIndex + 1];
        const nextInput = document.getElementById(`${nextField}-${tempId}`);
        if(nextInput) {
            nextInput.focus();
            if(nextInput.getAttribute('role') === 'combobox') {
              (nextInput as HTMLButtonElement).click();
            }
        }
    } else {
        const currentItemIndex = items.findIndex(item => item.tempId === tempId);
        if(currentItemIndex === items.length - 1) {
            handleAddRow();
            setTimeout(() => {
                const nextItem = items[items.length - 1]; // This is tricky, need to wait for state update
                 const allRows = document.querySelectorAll('[id^="name-"]');
                 const lastRowInput = allRows[allRows.length -1];
                 if(lastRowInput) (lastRowInput as HTMLInputElement).focus();
            }, 50)
        } else {
            const nextItem = items[currentItemIndex + 1];
            const nextInput = document.getElementById(`name-${nextItem.tempId}`);
            nextInput?.focus();
        }
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bulk Add New Items</DialogTitle>
          <DialogDescription>
            Add multiple items at once using this table. Name, Group, and Unit are required for each item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <ScrollArea className="h-[50vh] w-full">
            <Table>
                <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="w-[180px]">Item Group</TableHead>
                        <TableHead className="w-[120px]">Unit</TableHead>
                        <TableHead className="w-[150px]">Alias Code</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.tempId}>
                            <TableCell>
                                <Input 
                                    id={`name-${item.tempId}`}
                                    placeholder="e.g., UltraTech Cement"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(item.tempId, 'name', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item.tempId, 'name')}
                                />
                            </TableCell>
                            <TableCell>
                                <Select onValueChange={(value) => handleItemChange(item.tempId, 'group', value)} value={item.group}>
                                    <SelectTrigger id={`group-${item.tempId}`} onKeyDown={(e) => handleKeyDown(e, item.tempId, 'group')}>
                                        <SelectValue placeholder="Select group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemGroups.map(g => (
                                            <SelectItem key={`${dialogId}-${item.tempId}-${g}`} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                               <Select onValueChange={(value) => handleItemChange(item.tempId, 'unit', value)} value={item.unit}>
                                    <SelectTrigger id={`unit-${item.tempId}`} onKeyDown={(e) => handleKeyDown(e, item.tempId, 'unit')}>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitOptions.map(u => (
                                            <SelectItem key={`${dialogId}-${item.tempId}-${u}`} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input 
                                    id={`alias-${item.tempId}`}
                                    placeholder="Optional"
                                    value={item.alias}
                                    onChange={(e) => handleItemChange(item.tempId, 'alias', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item.tempId, 'alias')}
                                />
                            </TableCell>
                             <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(item.tempId)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </ScrollArea>
        </div>
        <DialogFooter className="justify-between">
           <Button variant="outline" onClick={handleAddRow}>
             <PlusCircle className="mr-2 h-4 w-4" /> Add Row
          </Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    