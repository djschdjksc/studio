"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { LoadingSlipFiltersState, BillingItem } from "@/lib/types";
import { format } from "date-fns";
import React, { useRef, useMemo } from "react";
import { Printer } from "lucide-react";

interface LoadingSlipPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LoadingSlipFiltersState;
  billingItems: BillingItem[];
}

export function LoadingSlipPreviewDialog({
  isOpen,
  onClose,
  filters,
  billingItems,
}: LoadingSlipPreviewDialogProps) {
  const billRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    window.print();
  };

  const filteredBillingItems = billingItems.filter(item => item.itemName && item.quantity);
  const totalQuantity = useMemo(() => filteredBillingItems.reduce((acc, item) => acc + (item.quantity || 0), 0), [filteredBillingItems]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0" id="slip-preview-dialog">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Loading Slip Preview</DialogTitle>
          <DialogDescription>
            Review the slip details below before printing.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] border-t">
            <div ref={billRef} className="bg-white text-black" id="slip-preview-content">
                <div className="p-8">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Loading Slip</h1>
                    <p className="text-sm text-gray-500">
                        BillTrack Pro
                    </p>
                </header>
                <style>{`
                @media print {
                    body * {
                      visibility: hidden;
                    }
                    #slip-preview-dialog, #slip-preview-dialog * {
                      visibility: visible;
                    }
                    #slip-preview-dialog {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      height: auto;
                      overflow: visible;
                      max-height: none;
                    }
                    #dialog-footer {
                        display: none;
                    }
                }
                `}</style>
                
                <section id="filters-section" className="mb-6 p-4 border rounded-lg text-base">
                    <h2 className="text-xl font-semibold mb-3 border-b pb-2">Slip Details</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div><strong className="font-semibold">Party Name:</strong> {filters.partyName}</div>
                        <div className="col-span-2"><strong className="font-semibold">Address:</strong> {filters.address}</div>
                        <div><strong className="font-semibold">Date:</strong> {filters.date ? format(new Date(filters.date), 'PPP') : 'N/A'}</div>
                        <div><strong className="font-semibold">Slip No:</strong> {filters.slipNo || 'N/A'}</div>
                    </div>
                     {filters.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <strong className="font-semibold">Notes: </strong>
                            <span className="whitespace-pre-wrap">{filters.notes}</span>
                        </div>
                    )}
                </section>

                <Separator className="my-6" />

                <section id="billing-items-section" className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">Items</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Sr.No</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBillingItems.map((item) => (
                                <TableRow key={item.srNo}>
                                    <TableCell>{item.srNo}</TableCell>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
                
                <div className="flex justify-end mt-4 p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-4 text-xl font-bold">
                        <span>Total Quantity:</span>
                        <span className="text-gray-800">{totalQuantity.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <footer className="text-center mt-12 text-xs text-gray-500">
                    <p>This is not a bill.</p>
                </footer>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t bg-background" id="dialog-footer">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Slip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
