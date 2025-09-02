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
import { PlusCircle } from "lucide-react";

export function NewItemDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
            <Input id="itemName" placeholder="e.g., UltraTech Cement" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemGroup" className="text-right">
              Item Group
            </Label>
            <Select>
              <SelectTrigger id="itemGroup" className="col-span-3">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cement">Cement</SelectItem>
                <SelectItem value="steel">TMT Steel</SelectItem>
                <SelectItem value="aggregates">Aggregates</SelectItem>
                <SelectItem value="bricks">Bricks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Input id="unit" placeholder="e.g., Bags, Kg, Pcs" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alias" className="text-right">
              Alias Code
            </Label>
            <Input id="alias" placeholder="e.g., UTC01" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
