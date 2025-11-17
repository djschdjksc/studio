
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Item, ProductionLog } from '@/lib/types';
import { ItemSearchInput } from './item-search-input';
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

interface ProductionItem {
    id: string;
    itemName: string;
    quantity: number;
}

interface ProductionCardProps {
    machineName: string;
    items: Item[];
    productionDate: string;
}

export default function ProductionCard({ machineName, items, productionDate }: ProductionCardProps) {
    const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const addProductionRow = () => {
        setProductionItems([...productionItems, { id: crypto.randomUUID(), itemName: '', quantity: 0 }]);
    };

    const handleItemChange = (id: string, field: 'itemName' | 'quantity', value: string | number) => {
        const updatedItems = productionItems.map(item => {
            if (item.id === id) {
                if (field === 'quantity') {
                    const numValue = Number(value);
                    return { ...item, [field]: isNaN(numValue) ? 0 : numValue };
                }
                return { ...item, [field]: String(value) };
            }
            return item;
        });
        setProductionItems(updatedItems);
    };

    const removeProductionRow = (id: string) => {
        setProductionItems(productionItems.filter(item => item.id !== id));
    };
    
    const handleSave = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: "Error", description: "Database not available." });
            return;
        }

        const validItems = productionItems.filter(i => i.itemName && i.quantity > 0);
        if (validItems.length === 0) {
            toast({ variant: 'destructive', title: "No items to save", description: "Please add items and quantities." });
            return;
        }

        const batch = writeBatch(firestore);

        for (const prodItem of validItems) {
            const itemInfo = items.find(i => i.name.toLowerCase() === prodItem.itemName.toLowerCase());
            if (!itemInfo) continue;

            // 1. Create a production log entry
            const logRef = doc(collection(firestore, 'productionLogs'));
            const logEntry: Omit<ProductionLog, 'id'> = {
                machineName,
                itemId: itemInfo.id,
                itemName: itemInfo.name,
                quantity: prodItem.quantity,
                date: productionDate,
                createdAt: serverTimestamp(),
            };
            batch.set(logRef, logEntry);
        }
        
        try {
            await batch.commit();
            toast({
                title: "Production Saved",
                description: `Saved ${validItems.length} entries for ${machineName}.`,
            });
            setProductionItems([]); // Clear the card after saving
        } catch (error) {
            console.error("Error saving production:", error);
            toast({
                variant: 'destructive',
                title: "Error Saving Production",
                description: "Could not save production data. Please try again."
            })
        }
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{machineName}</CardTitle>
                <Button variant="outline" size="sm" onClick={addProductionRow}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                <ScrollArea className="h-[200px] w-full">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-[100px] text-right">Quantity</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productionItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                        No items added.
                                    </TableCell>
                                </TableRow>
                            )}
                            {productionItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <ItemSearchInput
                                            id={`prod-item-${item.id}`}
                                            items={items}
                                            value={item.itemName}
                                            onValueChange={(value) => handleItemChange(item.id, 'itemName', value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.quantity || ''}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                            className="text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeProductionRow(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4">
                <Button className="w-full" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Production for {machineName}
                </Button>
            </CardFooter>
        </Card>
    );
}
