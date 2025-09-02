"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BillingItem, Item } from "@/lib/types";
import { ItemSearchInput } from "./item-search-input";
import { useMemo } from "react";

interface MainBillingTableProps {
  billingItems: BillingItem[];
  items: Item[];
  onAddRow: () => void;
  onItemChange: (index: number, field: keyof BillingItem, value: string | number) => void;
  onRemoveRow: (srNo: number) => void;
}

export default function MainBillingTable({ billingItems, items, onAddRow, onItemChange, onRemoveRow }: MainBillingTableProps) {
  const grandTotal = useMemo(() => {
    return billingItems.reduce((total, billItem) => {
        const item = items.find(i => i.name === billItem.itemName);
        const price = item?.price || 0;
        return total + (billItem.quantity * price);
    }, 0);
  }, [billingItems, items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextField: HTMLElement | null = null;
      if (field === 'itemName') {
        nextField = document.getElementById(`quantity-${rowIndex}`);
      } else if (field === 'quantity') {
        nextField = document.getElementById(`uCap-${rowIndex}`);
      } else if (field === 'uCap') {
        nextField = document.getElementById(`lCap-${rowIndex}`);
      } else if (field === 'lCap') {
        if(rowIndex < billingItems.length - 1) {
            nextField = document.getElementById(`itemName-input-${rowIndex + 1}`);
        } else {
            onAddRow();
            setTimeout(() => {
                document.getElementById(`itemName-input-${rowIndex + 1}`)?.focus();
            }, 0);
        }
      }

      if (nextField) {
        nextField.focus();
      }
    }
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Billing Details</CardTitle>
                <CardDescription>All items for the current bill.</CardDescription>
            </div>
            <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onAddRow}>
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
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {billingItems.map((item, index) => (
                <TableRow key={item.srNo}>
                    <TableCell>{item.srNo}</TableCell>
                    <TableCell className="font-medium">
                        <ItemSearchInput
                            id={`itemName-${index}`}
                            items={items} 
                            value={item.itemName}
                            onValueChange={(value) => onItemChange(index, 'itemName', value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'itemName')}
                        />
                    </TableCell>
                    <TableCell>
                        <Input 
                            id={`quantity-${index}`}
                            type="number" 
                            value={item.quantity || ''} 
                            onChange={(e) => onItemChange(index, 'quantity', e.target.value)} 
                            onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                            className="text-right"
                            placeholder="0"
                        />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                        <Input 
                            id={`uCap-${index}`}
                            type="number" 
                            value={item.uCap || ''} 
                            onChange={(e) => onItemChange(index, 'uCap', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'uCap')}
                             className="text-right"
                             placeholder="0.00"
                        />
                    </TableCell>
                    <TableCell>
                        <Input 
                            id={`lCap-${index}`}
                            type="number" 
                            value={item.lCap || ''} 
                            onChange={(e) => onItemChange(index, 'lCap', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'lCap')}
                             className="text-right"
                             placeholder="0.00"
                        />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onRemoveRow(item.srNo)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end p-4 border-t bg-card">
        <div className="flex items-center gap-4 text-lg font-bold">
            <span>Grand Total:</span>
            <span className="text-primary">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
