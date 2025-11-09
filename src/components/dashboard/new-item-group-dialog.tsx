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
import { Layers } from "lucide-react";
import { useState } from "react";

interface NewItemGroupDialogProps {
  onSave: (groupName: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewItemGroupDialog({ onSave, isOpen, onOpenChange }: NewItemGroupDialogProps) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item Group</DialogTitle>
          <DialogDescription>
            Enter the name for the new item group. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Group Name
            </Label>
            <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Plumbing" 
                className="col-span-3"
                onKeyDown={(e) => { if(e.key === 'Enter') handleSave() }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
