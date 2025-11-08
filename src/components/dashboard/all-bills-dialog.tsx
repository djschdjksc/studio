
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Item, SavedBill, WithId } from "@/lib/types";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Trash2, FileText } from "lucide-react";

interface AllBillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savedBills: Record<string, WithId<SavedBill>>;
  onLoadBill: (slipNo: string) => void;
  onDeleteBill: (slipNo: string) => void;
  items: Item[];
  canDelete: boolean;
}

const calculateGrandTotal = (bill: SavedBill, items: Item[]): number => {
    const summaryMap = new Map<string, { totalQty: number }>();
    bill.billingItems.forEach((billItem) => {
      const itemInfo = items.find((i) => i.name.toLowerCase() === billItem.itemName.toLowerCase());
      if (!itemInfo || !billItem.quantity || !itemInfo.group) return;
      const group = itemInfo.group;
      if (summaryMap.has(group)) {
        summaryMap.get(group)!.totalQty += billItem.quantity;
      } else {
        summaryMap.set(group, { totalQty: billItem.quantity });
      }
    });

    const uCapTotal = bill.billingItems.reduce((sum, item) => sum + (item.uCap || 0), 0);
    const lCapTotal = bill.billingItems.reduce((sum, item) => sum + (item.lCap || 0), 0);

    const allSummaryItems = Array.from(summaryMap.entries()).map(([item, data]) => {
      const groupKey = item.toLowerCase();
      const price = bill.manualPrices[groupKey] !== undefined ? bill.manualPrices[groupKey] : 0;
      return {
        totalPrice: data.totalQty * price,
      };
    });

    const uCapPrice = bill.manualPrices["u cap"] !== undefined ? bill.manualPrices["u cap"] : 0;
    if (uCapTotal > 0 || bill.manualPrices["u cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: uCapTotal * uCapPrice,
      });
    }

    const lCapPrice = bill.manualPrices["l cap"] !== undefined ? bill.manualPrices["l cap"] : 0;
    if (lCapTotal > 0 || bill.manualPrices["l cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: lCapTotal * lCapPrice,
      });
    }

    return allSummaryItems.reduce((acc, item) => acc + item.totalPrice, 0);
};


export function AllBillsDialog({
  isOpen,
  onClose,
  savedBills,
  onLoadBill,
  onDeleteBill,
  items,
  canDelete,
}: AllBillsDialogProps) {

  const billsArray = useMemo(() => {
    return Object.values(savedBills)
      .map((bill) => ({
        ...bill,
        grandTotal: calculateGrandTotal(bill, items),
      }))
      .sort((a, b) => Number(b.filters.slipNo) - Number(a.filters.slipNo));
  }, [savedBills, items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>All Saved Bills</DialogTitle>
          <DialogDescription>
            Here you can view, load, or delete any of your previously saved bills.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] border-t">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[100px]">Slip No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-center w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billsArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No saved bills found.
                  </TableCell>
                </TableRow>
              ) : (
                billsArray.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.filters.slipNo}</TableCell>
                    <TableCell>
                      {bill.filters.date
                        ? format(new Date(bill.filters.date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{bill.filters.partyName}</TableCell>
                    <TableCell className="text-right font-semibold">
                       ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLoadBill(bill.filters.slipNo)}
                          className="mr-2"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        {canDelete && (
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1"/>
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the bill with Slip No. <span className="font-bold">{bill.filters.slipNo}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteBill(bill.filters.slipNo)}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
