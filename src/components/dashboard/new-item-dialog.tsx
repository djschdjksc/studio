
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
import { Item } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { useState, useRef, KeyboardEvent } from "react";

interface NewItemDialogProps {
    onSave: (item: Omit<Item, 'id' | 'price'>) => void;
    itemGroups: string[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const unitOptions = ["PCS", "BOXE", "BUNDLE", "SQM", "MTR", "PKT"];

export function NewItemDialog({ onSave, itemGroups, isOpen, onOpenChange }: NewItemDialogProps) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [unit, setUnit] = useState("");
  const [alias, setAlias] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const groupTriggerRef = useRef<HTMLButtonElement>(null);
  const unitTriggerRef = useRef<HTMLButtonElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if(!name.trim() || !group.trim() || !unit.trim()) return;
    onSave({ name, group, unit, alias });
    setName("");
    setGroup("");
    setUnit("");
    setAlias("");
    onOpenChange(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef: React.RefObject<HTMLInputElement | HTMLButtonElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (nextFieldRef.current) {
            nextFieldRef.current.focus();
            if(nextFieldRef.current.getAttribute('role') === 'combobox') {
              (nextFieldRef.current as HTMLButtonElement).click();
            }
        } else {
          handleSave();
        }
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={() => nameRef.current?.focus()}>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Enter the details for the new item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemName" className="text-right">
              Item Name
            </Label>
            <Input ref={nameRef} id="itemName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., UltraTech Cement" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, groupTriggerRef)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemGroup" className="text-right">
              Item Group
            </Label>
            <Select onValueChange={setGroup} value={group}>
              <SelectTrigger ref={groupTriggerRef} id="itemGroup" className="col-span-3" onKeyDown={(e) => {if(e.key === 'Enter') { e.preventDefault(); unitTriggerRef.current?.focus(); unitTriggerRef.current?.click();}}}>
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
            <Select onValueChange={setUnit} value={unit}>
                <SelectTrigger ref={unitTriggerRef} id="unit" className="col-span-3" onKeyDown={(e) => {if(e.key === 'Enter') { e.preventDefault(); aliasRef.current?.focus()}}}>
                    <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                    {unitOptions.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alias" className="text-right">
              Alias Code
            </Label>
            <Input ref={aliasRef} id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g., UTC01 (Optional)" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, saveBtnRef)} />
          </div>
        </div>
        <DialogFooter>
          <Button ref={saveBtnRef} onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
