
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BillingItem, Item } from "@/lib/types";
import { ItemSearchInput } from "./item-search-input";

interface MainBillingTableProps {
  billingItems: BillingItem[];
  items: Item[];
  onAddRow: () => void;
  onItemChange: (index: number, field: keyof BillingItem, value: string | number) => void;
  onRemoveRow: (srNo: number) => void;
}

export default function MainBillingTable({ billingItems, items, onAddRow, onItemChange, onRemoveRow }: MainBillingTableProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, rowIndex: number, fieldName: keyof BillingItem | 'itemName-input') => {
    const fieldIdMap: (keyof BillingItem | 'itemName-input')[] = ['itemName-input', 'quantity', 'uCap', 'lCap'];
    const currentFieldIndex = fieldIdMap.indexOf(fieldName);
    
    let nextRowIndex = rowIndex;
    let nextFieldIndex = currentFieldIndex;

    const focusCell = (row: number, field: keyof BillingItem | 'itemName-input') => {
        const fieldId = `${field}-${row}`;
        const nextField = document.getElementById(fieldId);
        if (nextField) {
            nextField.focus();
            (nextField as HTMLInputElement).select?.();
        }
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFieldIndex === fieldIdMap.length - 1) { // Last field in the row
            if (rowIndex === billingItems.length - 1) { // Last row
                onAddRow();
                // Use setTimeout to allow React to re-render
                setTimeout(() => focusCell(rowIndex + 1, 'itemName-input'), 0);
            } else {
                focusCell(rowIndex + 1, 'itemName-input');
            }
        } else {
            focusCell(rowIndex, fieldIdMap[currentFieldIndex + 1]);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            focusCell(rowIndex - 1, fieldName);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rowIndex < billingItems.length - 1) {
            focusCell(rowIndex + 1, fieldName);
        }
    } else if (e.key === 'ArrowLeft') {
       if (currentFieldIndex > 0) {
            e.preventDefault();
            focusCell(rowIndex, fieldIdMap[currentFieldIndex - 1]);
       }
    } else if (e.key === 'ArrowRight') {
        if (currentFieldIndex < fieldIdMap.length - 1) {
            e.preventDefault();
            focusCell(rowIndex, fieldIdMap[currentFieldIndex + 1]);
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
                            id={`itemName-input-${index}`}
                            items={items} 
                            value={item.itemName}
                            onValueChange={(value) => onItemChange(index, 'itemName', value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'itemName-input')}
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
    </Card>
  );
}
