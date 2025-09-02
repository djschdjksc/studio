"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const summaryItems = [
    { item: "Cement", totalQty: 250, price: 350.00, totalPrice: 87500.00 },
    { item: "TMT Steel", totalQty: 850, price: 55.00, totalPrice: 46750.00 },
    { item: "Aggregates", totalQty: 3.5, price: 2500.00, totalPrice: 8750.00 },
    { item: "Bricks", totalQty: 2000, price: 8.00, totalPrice: 16000.00 },
];

export default function TotalsSummary() {
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
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryItems.map((item) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell className="text-right">{item.totalQty.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
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
            <span className="text-primary">₹ 1,59,000.00</span>
        </div>
      </CardFooter>
    </Card>
  );
}
