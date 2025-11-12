
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
import { FileUp, Printer, Send } from "lucide-react";
import TotalsSummary from "./totals-summary";

type PrintMode = 'bill' | 'loadingSlip';

interface BillPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  billingItems: BillingItem[];
  items: Item[];
  manualPrices: Record<string, number>;
  printMode: PrintMode;
}

export function BillPreviewDialog({
  isOpen,
  onClose,
  filters,
  billingItems,
  items,
  manualPrices,
  printMode,
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
        const date = filters.date ? format(new Date(filters.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        link.download = `bill-${filters.partyName.replace(/\s/g, '_')}-${date}.png`;
        link.href = dataUrl;
        link.click();
        
        toast({
            title: "Image downloaded!",
            description: "Please attach the downloaded image to your WhatsApp message.",
        });

        const phoneNumber = "7528847355";
        const message = encodeURIComponent(`Bill for ${filters.partyName}. Slip No: ${filters.slipNo}`);
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
  }, [filters.partyName, filters.date, filters.slipNo, toast]);

  const filteredBillingItems = billingItems.filter(item => item.itemName && item.quantity);
  const totalQuantity = useMemo(() => filteredBillingItems.reduce((acc, item) => acc + (item.quantity || 0), 0), [filteredBillingItems]);

  const handlePriceChange = (group: string, price: number) => {
    // This function is a prop for TotalsSummary, but its implementation is in billing-dashboard.
    // To avoid prop-drilling or complex state management here, we assume the parent handles it.
    // The preview is read-only in this context.
  };

  const isBillMode = printMode === 'bill';
  const dialogTitle = isBillMode ? 'Bill Preview' : 'Loading Slip Preview';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 print:hidden" id="bill-preview-dialog">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-content, #printable-content * {
              visibility: visible;
            }
            #printable-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            #printable-content table td, #printable-content table th {
                border: 2px solid black !important;
                font-weight: bold;
            }
          }
        `}</style>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Review the details below before printing or sending.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div ref={billRef} className="bg-white text-black">
              <div className="p-8">
              <header className="mb-8 text-center print-hidden">
                  <h1 className="text-3xl font-bold text-gray-800">BillTrack Pro</h1>
                  <p className="text-sm text-gray-500">
                      Your Trusted Billing Partner <br />
                      123 Business Rd, Commerce City, 12345
                  </p>
              </header>
              
              <section id="filters-section" className="mb-6 p-4 border rounded-lg text-base">
                  <h2 className="text-xl font-semibold mb-3 border-b pb-2">{isBillMode ? 'Bill Details' : 'Loading Slip Details'}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                      <div><strong className="font-semibold">Party Name:</strong> {filters.partyName}</div>
                      <div className="col-span-2"><strong className="font-semibold">Address:</strong> {filters.address}</div>
                      <div><strong className="font-semibold">Date:</strong> {filters.date ? format(new Date(filters.date), 'PPP') : 'N/A'}</div>
                      <div><strong className="font-semibold">{isBillMode ? 'Bill No:' : 'Slip No:'}</strong> {filters.slipNo || 'N/A'}</div>
                      {isBillMode && (
                        <>
                          <div><strong className="font-semibold">Vehicle No:</strong> {filters.vehicleNo || 'N/A'}</div>
                          <div><strong className="font-semibold">Vehicle Type:</strong> {filters.vehicleType || 'N/A'}</div>
                          <div><strong className="font-semibold">Bill Type:</strong> <span className="capitalize">{filters.billType}</span></div>
                        </>
                      )}
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

              {isBillMode ? (
                <section id="summary-section">
                     <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2">
                            {filters.notes && (
                                <>
                                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">Notes</h2>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{filters.notes}</p>
                                </>
                            )}
                        </div>
                        <div className="col-span-3">
                            <TotalsSummary
                                billingItems={billingItems}
                                items={items}
                                manualPrices={manualPrices}
                                onManualPriceChange={handlePriceChange}
                                canEdit={false} // Preview is read-only
                            />
                        </div>
                     </div>
                </section>
              ) : (
                <div className="flex justify-end mt-4 p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-4 text-xl font-bold">
                        <span>Total Quantity:</span>
                        <span className="text-gray-800">{totalQuantity.toLocaleString('en-IN')}</span>
                    </div>
                </div>
              )}

              <footer className="text-center mt-12 text-xs text-gray-500 print-hidden">
                  <p>Thank you for your business!</p>
                  <p>All disputes subject to local jurisdiction.</p>
              </footer>
              </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t bg-background">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
          {isBillMode && (
            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              <Send className="mr-2 h-4 w-4" />
              Send to WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {/* This is the printable content that will be shown only when printing */}
      <div id="printable-content" className="hidden print:block bg-white text-black">
        <div ref={billRef} className="p-8">
            <header className="mb-8 text-center print-hidden">
                <h1 className="text-3xl font-bold text-gray-800">BillTrack Pro</h1>
                <p className="text-sm text-gray-500">
                    Your Trusted Billing Partner <br />
                    123 Business Rd, Commerce City, 12345
                </p>
            </header>
            
            <section id="filters-section-print" className="mb-6 p-4 border rounded-lg text-base">
                <h2 className="text-xl font-semibold mb-3 border-b pb-2">{isBillMode ? 'Bill Details' : 'Loading Slip Details'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <div><strong className="font-semibold">Party Name:</strong> {filters.partyName}</div>
                    <div className="col-span-2"><strong className="font-semibold">Address:</strong> {filters.address}</div>
                    <div><strong className="font-semibold">Date:</strong> {filters.date ? format(new Date(filters.date), 'PPP') : 'N/A'}</div>
                    <div><strong className="font-semibold">{isBillMode ? 'Bill No:' : 'Slip No:'}</strong> {filters.slipNo || 'N/A'}</div>
                    {isBillMode && (
                      <>
                        <div><strong className="font-semibold">Vehicle No:</strong> {filters.vehicleNo || 'N/A'}</div>
                        <div><strong className="font-semibold">Vehicle Type:</strong> {filters.vehicleType || 'N/A'}</div>
                        <div><strong className="font-semibold">Bill Type:</strong> <span className="capitalize">{filters.billType}</span></div>
                      </>
                    )}
                </div>
            </section>

            <Separator className="my-6" />

            <section id="billing-items-section-print" className="mb-6">
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

            {isBillMode ? (
              <section id="summary-section-print">
                   <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-2">
                          {filters.notes && (
                              <>
                                  <h2 className="text-lg font-semibold mb-3 border-b pb-2">Notes</h2>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{filters.notes}</p>
                              </>
                          )}
                      </div>
                      <div className="col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Totals Summary</CardTitle>
                                <CardDescription>Grouped totals for all items.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TotalsSummary
                                    billingItems={billingItems}
                                    items={items}
                                    manualPrices={manualPrices}
                                    onManualPriceChange={handlePriceChange}
                                    canEdit={false}
                                />
                            </CardContent>
                        </Card>
                      </div>
                   </div>
              </section>
            ) : (
              <div className="flex justify-end mt-4 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-4 text-xl font-bold">
                      <span>Total Quantity:</span>
                      <span className="text-gray-800">{totalQuantity.toLocaleString('en-IN')}</span>
                  </div>
              </div>
            )}

            <footer className="text-center mt-12 text-xs text-gray-500 print-hidden">
                <p>Thank you for your business!</p>
                <p>All disputes subject to local jurisdiction.</p>
            </footer>
        </div>
      </div>
    </Dialog>
  );
}
