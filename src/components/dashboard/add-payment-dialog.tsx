
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
import { Payment } from "@/lib/types";
import { format } from "date-fns";
import { useState, useRef, KeyboardEvent } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id' | 'createdAt' | 'partyName' | 'partyId'>) => void;
  partyName: string;
}

export function AddPaymentDialog({ isOpen, onClose, onSave, partyName }: AddPaymentDialogProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if (typeof amount !== 'number' || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
      });
      return;
    }
    onSave({ amount, date, notes });
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={() => amountRef.current?.focus()}>
        <DialogHeader>
          <DialogTitle>Add Payment for {partyName}</DialogTitle>
          <DialogDescription>
            Record a payment received from this party.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input 
              ref={amountRef} 
              id="amount" 
              type="number"
              value={amount} 
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              placeholder="0.00" 
              className="col-span-3" 
              onKeyDown={(e) => handleKeyDown(e, dateRef)} 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input 
              ref={dateRef} 
              id="date" 
              type="date"
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="col-span-3" 
              onKeyDown={(e) => handleKeyDown(e, notesRef)} 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea 
              ref={notesRef} 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="e.g., Online transfer" 
              className="col-span-3" 
              onKeyDown={(e) => handleKeyDown(e, saveBtnRef)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button ref={saveBtnRef} onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
