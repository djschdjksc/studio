
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@/lib/types";
import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BulkAddItemDialogProps {
    onSave: (items: Omit<Item, 'id' | 'price' | 'alias'>[]) => void;
    itemGroups: string[];
}

export function BulkAddItemDialog({ onSave, itemGroups }: BulkAddItemDialogProps) {
  const [group, setGroup] = useState("");
  const [unit, setUnit] = useState("");
  const [itemNames, setItemNames] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if(!group.trim() || !unit.trim() || !itemNames.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please select a group, enter a unit, and provide at least one item name.",
        });
        return;
    }

    const namesArray = itemNames.split('\n').map(name => name.trim()).filter(name => name.length > 0);
    
    if(namesArray.length === 0) {
        toast({
            variant: "destructive",
            title: "No Item Names",
            description: "Please enter at least one item name.",
        });
        return;
    }

    const newItems = namesArray.map(name => ({
        name,
        group,
        unit,
    }));

    onSave(newItems);
    
    toast({
        title: "Items Added!",
        description: `${newItems.length} new items have been added to the '${group}' group.`,
    });

    setGroup("");
    setUnit("");
    setItemNames("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Add New Items</DialogTitle>
          <DialogDescription>
            Create multiple items at once. Enter one item name per line.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemGroup" className="text-right">
              Item Group
            </Label>
            <Select onValueChange={setGroup} value={group}>
              <SelectTrigger id="itemGroup" className="col-span-3">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {itemGroups.map(g => (
                    <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g., Bags, Kg, Pcs" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="itemNames" className="text-right pt-2">
              Item Names
            </Label>
            <Textarea 
                id="itemNames" 
                value={itemNames} 
                onChange={(e) => setItemNames(e.target.value)} 
                placeholder="UltraTech Cement&#10;Ambuja Cement&#10;ACC Suraksha" 
                className="col-span-3 min-h-[120px]" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
