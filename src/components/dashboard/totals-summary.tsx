
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BillingItem, Item } from "@/lib/types";
import { useMemo } from "react";
import { Input } from "../ui/input";

interface TotalsSummaryProps {
    billingItems: BillingItem[];
    items: Item[];
    manualPrices: Record<string, number>;
    onManualPriceChange: (group: string, price: number) => void;
}

interface SummaryItem {
    item: string;
    totalQty: number;
    price: number;
    totalPrice: number;
}

export default function TotalsSummary({ billingItems, items, manualPrices, onManualPriceChange }: TotalsSummaryProps) {

    const { summaryItems, grandTotal } = useMemo(() => {
        const summaryMap = new Map<string, { totalQty: number, totalPrice: number }>();

        // Calculate totals for regular item groups
        billingItems.forEach(billItem => {
            const itemInfo = items.find(i => i.name.toLowerCase() === billItem.itemName.toLowerCase());
            if (!itemInfo || !billItem.quantity || !itemInfo.group) return;

            const group = itemInfo.group;
            
            if (summaryMap.has(group)) {
                summaryMap.get(group)!.totalQty += billItem.quantity;
            } else {
                summaryMap.set(group, {
                    totalQty: billItem.quantity,
                    totalPrice: 0,
                });
            }
        });

        // Calculate totals for U Cap and L Cap
        const uCapTotal = billingItems.reduce((sum, item) => sum + (item.uCap || 0), 0);
        const lCapTotal = billingItems.reduce((sum, item) => sum + (item.lCap || 0), 0);

        const allSummaryItems: SummaryItem[] = Array.from(summaryMap.entries()).map(([item, data]) => {
            const groupKey = item.toLowerCase();
            const manualPrice = manualPrices[groupKey];
            const price = manualPrice !== undefined ? manualPrice : 0;
            return {
                item: item.charAt(0).toUpperCase() + item.slice(1),
                totalQty: data.totalQty,
                price: price,
                totalPrice: data.totalQty * price,
            };
        });

        // Add U Cap summary item
        const uCapPrice = manualPrices['u cap'] !== undefined ? manualPrices['u cap'] : 0;
        if(uCapTotal > 0 || manualPrices['u cap'] !== undefined) {
            allSummaryItems.push({
                item: "U Cap",
                totalQty: uCapTotal,
                price: uCapPrice,
                totalPrice: uCapTotal * uCapPrice
            });
        }
        
        // Add L Cap summary item
        const lCapPrice = manualPrices['l cap'] !== undefined ? manualPrices['l cap'] : 0;
        if(lCapTotal > 0 || manualPrices['l cap'] !== undefined) {
            allSummaryItems.push({
                item: "L Cap",
                totalQty: lCapTotal,
                price: lCapPrice,
                totalPrice: lCapTotal * lCapPrice
            });
        }

        const grandTotal = allSummaryItems.reduce((acc, item) => acc + item.totalPrice, 0);

        return { summaryItems: allSummaryItems, grandTotal };

    }, [billingItems, items, manualPrices]);


    const handlePriceChange = (item: string, value: string) => {
        const price = Number(value);
        if (!isNaN(price)) {
            onManualPriceChange(item.toLowerCase(), price);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.getElementById(`price-${rowIndex + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Totals Summary</CardTitle>
        <CardDescription>Grouped totals for all items.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Item Group</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryItems.map((item, index) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell className="text-right">
                    {item.totalQty || ''}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                        id={`price-${index}`}
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => handlePriceChange(item.item, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="text-right h-8"
                        placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">₹{item.totalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end p-4 border-t bg-card">
        <div className="flex items-center gap-4 text-lg font-bold">
            <span>Grand Total:</span>
            <span className="text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
