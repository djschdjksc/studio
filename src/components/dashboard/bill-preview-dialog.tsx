
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
import { SearchFiltersState, BillingItem, Item, SummaryItem } from "@/lib/types";
import { format } from "date-fns";
import React, { useRef, useMemo, useCallback } from "react";
import * as htmlToImage from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface BillPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  billingItems: BillingItem[];
  items: Item[];
  manualPrices: Record<string, number>;
}

export function BillPreviewDialog({
  isOpen,
  onClose,
  filters,
  billingItems,
  items,
  manualPrices,
}: BillPreviewDialogProps) {
  const billRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { summaryItems, grandTotal } = useMemo(() => {
    const summaryMap = new Map<string, { totalQty: number }>();

    billingItems.forEach((billItem) => {
      const itemInfo = items.find((i) => i.name.toLowerCase() === billItem.itemName.toLowerCase());
      if (!itemInfo || !billItem.quantity || !itemInfo.group) return;
      const group = itemInfo.group;
      if (summaryMap.has(group)) {
        summaryMap.get(group)!.totalQty += billItem.quantity;
      } else {
        summaryMap.set(group, { totalQty: billItem.quantity });
      }
    });

    const uCapTotal = billingItems.reduce((sum, item) => sum + (item.uCap || 0), 0);
    const lCapTotal = billingItems.reduce((sum, item) => sum + (item.lCap || 0), 0);

    const allSummaryItems: SummaryItem[] = Array.from(summaryMap.entries()).map(([item, data]) => {
      const groupKey = item.toLowerCase();
      const price = manualPrices[groupKey] !== undefined ? manualPrices[groupKey] : 0;
      return {
        item: item.charAt(0).toUpperCase() + item.slice(1),
        totalQty: data.totalQty,
        price: price,
        totalPrice: data.totalQty * price,
      };
    });

    const uCapPrice = manualPrices["u cap"] !== undefined ? manualPrices["u cap"] : 0;
    if (uCapTotal > 0 || manualPrices["u cap"] !== undefined) {
      allSummaryItems.push({
        item: "U Cap",
        totalQty: uCapTotal,
        price: uCapPrice,
        totalPrice: uCapTotal * uCapPrice,
      });
    }

    const lCapPrice = manualPrices["l cap"] !== undefined ? manualPrices["l cap"] : 0;
    if (lCapTotal > 0 || manualPrices["l cap"] !== undefined) {
      allSummaryItems.push({
        item: "L Cap",
        totalQty: lCapTotal,
        price: lCapPrice,
        totalPrice: lCapTotal * lCapPrice,
      });
    }

    const grandTotal = allSummaryItems.reduce((acc, item) => acc + item.totalPrice, 0);

    return { summaryItems: allSummaryItems.filter(item => item.totalPrice > 0 || item.totalQty > 0), grandTotal };
  }, [billingItems, items, manualPrices]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = useCallback(() => {
    if (!billRef.current) return;

    htmlToImage
      .toPng(billRef.current, { cacheBust: true, pixelRatio: 2, skipFonts: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `bill-${filters.partyName.replace(/\s/g, '_')}-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = dataUrl;
        link.click();
        
        toast({
            title: "Image downloaded!",
            description: "Please attach the downloaded image to your WhatsApp message.",
        });

        const phoneNumber = "7528847355";
        const message = encodeURIComponent(`Bill for ${filters.partyName}.`);
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");

      })
      .catch((err) => {
        console.error("oops, something went wrong!", err);
        toast({
            variant: "destructive",
            title: "Failed to generate image",
            description: "Could not create bill image. Please try again.",
        })
      });
  }, [filters.partyName, toast]);

  const filteredBillingItems = billingItems.filter(item => item.itemName && item.quantity);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0" id="bill-preview-dialog">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
          <DialogDescription>A preview of the generated bill for printing or sharing.</DialogDescription>
        </DialogHeader>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #bill-preview-content, #bill-preview-content * {
              visibility: visible;
            }
            #bill-preview-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            #dialog-footer {
                display: none;
            }
          }
        `}</style>
        <div ref={billRef} className="bg-white text-black" id="bill-preview-content">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-8">
              <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">BillTrack Pro</h1>
                <p className="text-sm text-gray-500">Your Trusted Billing Partner</p>
                <p className="text-xs text-gray-500 mt-1">123 Business Rd, Commerce City, 12345</p>
              </header>

              <section id="filters-section" className="mb-6 p-4 border rounded-lg">
                 <h2 className="text-lg font-semibold mb-3 border-b pb-2">Bill Details</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div><strong>Party Name:</strong> {filters.partyName}</div>
                    <div className="col-span-2"><strong>Address:</strong> {filters.address}</div>
                    <div><strong>Date:</strong> {filters.date ? format(filters.date, 'PPP') : 'N/A'}</div>
                    <div><strong>Slip No:</strong> {filters.slipNo || 'N/A'}</div>
                    <div><strong>Vehicle No:</strong> {filters.vehicleNo || 'N/A'}</div>
                    <div><strong>Vehicle Type:</strong> {filters.vehicleType || 'N/A'}</div>
                    <div><strong>Bill Type:</strong> <span className="capitalize">{filters.billType}</span></div>
                 </div>
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
                            <TableHead className="text-right">U Cap</TableHead>
                            <TableHead className="text-right">L Cap</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBillingItems.map((item) => (
                            <TableRow key={item.srNo}>
                                <TableCell>{item.srNo}</TableCell>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right">{item.uCap || ''}</TableCell>
                                <TableCell className="text-right">{item.lCap || ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              </section>

              <Separator className="my-6" />

              <section id="summary-section" className="flex justify-end">
                <div className="w-full md:w-2/3 lg:w-1/2">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">Summary</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Group</TableHead>
                                <TableHead className="text-right">Total Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summaryItems.map((item) => (
                                <TableRow key={item.item}>
                                    <TableCell className="font-medium">{item.item}</TableCell>
                                    <TableCell className="text-right">{item.totalQty}</TableCell>
                                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">₹{item.totalPrice.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4 p-4 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-4 text-xl font-bold">
                            <span>Grand Total:</span>
                            <span className="text-gray-800">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
              </section>
              <footer className="text-center mt-12 text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p>All disputes subject to local jurisdiction.</p>
              </footer>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="p-4 border-t bg-background" id="dialog-footer">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>Print Bill</Button>
          <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
            Send to WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    