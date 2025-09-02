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
        const summaryMap = new Map<string, { totalQty: number, totalPrice: number, price: number }>();

        billingItems.forEach(billItem => {
            const itemInfo = items.find(i => i.name === billItem.itemName);
            if (!itemInfo || !billItem.quantity) return;

            const group = itemInfo.group || 'Other';
            
            const manualPrice = manualPrices[group.toLowerCase()];
            const effectivePrice = manualPrice !== undefined ? manualPrice : (itemInfo.price || 0);

            const itemTotal = billItem.quantity * effectivePrice;

            if (summaryMap.has(group)) {
                const current = summaryMap.get(group)!;
                current.totalQty += billItem.quantity;
                current.totalPrice += billItem.quantity * effectivePrice; // Recalculate based on potentially mixed prices
            } else {
                summaryMap.set(group, {
                    totalQty: billItem.quantity,
                    totalPrice: itemTotal,
                    price: 0, // Will be calculated as an average later
                });
            }
        });
        
        const summaryItems: SummaryItem[] = Array.from(summaryMap.entries()).map(([item, data]) => {
            const groupKey = item.toLowerCase();
            const manualPrice = manualPrices[groupKey];
            const avgPrice = data.totalQty > 0 ? data.totalPrice / data.totalQty : 0;
            const displayPrice = manualPrice !== undefined ? manualPrice : avgPrice;

            return {
                item: item.charAt(0).toUpperCase() + item.slice(1), // Capitalize
                totalQty: data.totalQty,
                price: displayPrice,
                totalPrice: data.totalQty * displayPrice,
            }
        });

        const grandTotal = summaryItems.reduce((acc, item) => acc + item.totalPrice, 0);

        return { summaryItems, grandTotal };

    }, [billingItems, items, manualPrices]);


    const handlePriceChange = (item: string, value: string) => {
        const price = Number(value);
        if (!isNaN(price)) {
            onManualPriceChange(item, price);
        }
    }

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
                <TableHead className="text-right">Avg. Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryItems.map((item) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell className="text-right">
                    {item.totalQty || ''}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input 
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => handlePriceChange(item.item, e.target.value)}
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
