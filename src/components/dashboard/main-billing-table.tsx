"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const billingItems = [
  { srNo: 1, itemName: "UltraTech Cement", quantity: 100, unit: "Bags", uCap: 50.00, lCap: 49.85 },
  { srNo: 2, itemName: "TMT Steel Bar 8mm", quantity: 500, unit: "Kg", uCap: 12.1, lCap: 11.9 },
  { srNo: 3, itemName: "River Sand", quantity: 2, unit: "Brass", uCap: 1.0, lCap: 0.98 },
  { srNo: 4, itemName: "Bricks - Class A", quantity: 2000, unit: "Pcs", uCap: 2.5, lCap: 2.4 },
  { srNo: 5, itemName: "TMT Steel Bar 12mm", quantity: 350, unit: "Kg", uCap: 12.1, lCap: 11.9 },
  { srNo: 6, itemName: "ACC Cement", quantity: 150, unit: "Bags", uCap: 50.00, lCap: 49.85 },
  { srNo: 7, itemName: "Crushed Stone 20mm", quantity: 1.5, unit: "Brass", uCap: 1.0, lCap: 0.97 },
];

export default function MainBillingTable() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Billing Details</CardTitle>
                <CardDescription>All items for the current bill.</CardDescription>
            </div>
            <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Row
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[400px] w-full">
            <Table>
            <TableHeader className="sticky top-0 bg-card">
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
                {billingItems.map((item) => (
                <TableRow key={item.srNo}>
                    <TableCell>{item.srNo}</TableCell>
                    <TableCell className="font-medium">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input defaultValue={item.itemName} className="pl-9" />
                        </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.uCap.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.lCap.toFixed(2)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end p-4 border-t bg-card">
        <div className="flex items-center gap-4 text-lg font-bold">
            <span>Grand Total:</span>
            <span className="text-primary">₹ 1,23,456.78</span>
        </div>
      </CardFooter>
    </Card>
  );
}
