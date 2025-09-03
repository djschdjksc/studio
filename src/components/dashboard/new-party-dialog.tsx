
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
import { useState, useRef, KeyboardEvent } from "react";
import { Party } from "@/lib/types";

interface NewPartyDialogProps {
  onSave: (party: Omit<Party, 'id'>) => void;
}

export function NewPartyDialog({ onSave }: NewPartyDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if(!name.trim()) return;
    onSave({ name, address, phone });
    setName("");
    setAddress("");
    setPhone("");
    setIsOpen(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, nextFieldRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>) => {
    if (e.key === 'Enter') {
        if (e.currentTarget.tagName === 'TEXTAREA' && e.shiftKey) {
            // Allow shift+enter for newlines in textarea
            return;
        }
        e.preventDefault();
        if (nextFieldRef?.current) {
            nextFieldRef.current.focus();
        } else {
            handleSave();
        }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          New Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={() => nameRef.current?.focus()}>
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
            <Input ref={nameRef} id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Company" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, addressRef)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Textarea ref={addressRef} id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Anytown" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, phoneRef)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input ref={phoneRef} id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(123) 456-7890" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, saveBtnRef)} />
          </div>
        </div>
        <DialogFooter>
          <Button ref={saveBtnRef} onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Party</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
