
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, KeyboardEvent } from "react";
import { Party } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface NewPartyDialogProps {
  onSave: (party: Omit<Party, 'id'>) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewPartyDialog({ onSave, isOpen, onOpenChange }: NewPartyDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [station, setStation] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const pincodeRef = useRef<HTMLInputElement>(null);
  const stationRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if(!name.trim() || !station.trim()) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Party Name and Station are required fields.",
        });
        return;
    }
    onSave({ name, address, district, state, pincode, station, phone });
    setName("");
    setAddress("");
    setDistrict("");
    setState("");
    setPincode("");
    setStation("");
    setPhone("");
    onOpenChange(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, nextFieldRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>) => {
    if (e.key === 'Enter') {
        if (e.currentTarget.tagName === 'TEXTAREA' && e.shiftKey) {
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={() => nameRef.current?.focus()}>
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
            <Textarea ref={addressRef} id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, districtRef)} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="district" className="text-right">
              District
            </Label>
            <Input ref={districtRef} id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Anytown" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, stateRef)} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="state" className="text-right">
              State
            </Label>
            <Input ref={stateRef} id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, pincodeRef)} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pincode" className="text-right">
              Pin Code
            </Label>
            <Input ref={pincodeRef} id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="123456" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, stationRef)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="station" className="text-right">
              Station
            </Label>
            <Input ref={stationRef} id="station" value={station} onChange={(e) => setStation(e.target.value)} placeholder="Central Station" className="col-span-3" onKeyDown={(e) => handleKeyDown(e, phoneRef)} />
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
