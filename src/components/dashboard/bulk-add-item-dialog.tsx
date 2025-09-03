
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
}

const createNewBulkItem = (tempId: string): BulkItem => ({
    tempId,
    name: "",
    group: "",
    unit: "",
    alias: "",
});

export function BulkAddItemDialog({ onSave, itemGroups }: BulkAddItemDialogProps) {
  const [items, setItems] = useState<BulkItem[]>([createNewBulkItem(crypto.randomUUID())]);
  const [isOpen, setIsOpen] = useState(false);
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
    
    // remove tempId from the objects
    const itemsToSave = validItems.map(({tempId, ...rest}) => rest);

    onSave(itemsToSave);
    
    toast({
        title: "Items Added!",
        description: `${itemsToSave.length} new items have been added.`,
    });

    setItems([createNewBulkItem(crypto.randomUUID())]);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PackagePlus className="mr-2 h-4 w-4" />
          Bulk Add Items
        </Button>
      </DialogTrigger>
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
                                    placeholder="e.g., UltraTech Cement"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(item.tempId, 'name', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Select onValueChange={(value) => handleItemChange(item.tempId, 'group', value)} value={item.group}>
                                    <SelectTrigger>
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
                                <Input 
                                    placeholder="e.g., Bags"
                                    value={item.unit}
                                    onChange={(e) => handleItemChange(item.tempId, 'unit', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                    placeholder="Optional"
                                    value={item.alias}
                                    onChange={(e) => handleItemChange(item.tempId, 'alias', e.target.value)}
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
