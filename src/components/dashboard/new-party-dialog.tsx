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
import { UserPlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function NewPartyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          New Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Party</DialogTitle>
          <DialogDescription>
            Enter the details for the new party. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Party Name
            </Label>
            <Input id="name" placeholder="ABC Company" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Textarea id="address" placeholder="123 Main St, Anytown" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" type="tel" placeholder="(123) 456-7890" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Party</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
