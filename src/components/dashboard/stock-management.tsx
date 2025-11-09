
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ItemSearchInput } from './item-search-input';
import { Item, WithId } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

interface StockManagementProps {
  items: WithId<Item>[];
  onAddStock: (itemId: string, quantity: number) => void;
  canEdit: boolean;
}

export default function StockManagement({ items, onAddStock, canEdit }: StockManagementProps) {
  const [selectedItemName, setSelectedItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const selectedItem = items.find(item => item.name.toLowerCase() === selectedItemName.toLowerCase());
  const currentBalance = selectedItem?.balance ?? 0;

  const handleAddStock = () => {
    if (selectedItem && typeof quantity === 'number' && quantity > 0) {
      onAddStock(selectedItem.id, quantity);
      setSelectedItemName('');
      setQuantity('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Management</CardTitle>
        <CardDescription>Add new stock for items and view their current balance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stock-item-search">Item Name</Label>
          <ItemSearchInput
            id="stock-item-search"
            items={items}
            value={selectedItemName}
            onValueChange={setSelectedItemName}
            disabled={!canEdit}
          />
        </div>
        
        {selectedItem && (
             <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{currentBalance} <span className="text-sm font-normal">{selectedItem.unit}</span></p>
             </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="stock-quantity">Quantity to Add</Label>
          <Input
            id="stock-quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!canEdit || !selectedItem}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddStock();
            }}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAddStock} 
          disabled={!canEdit || !selectedItem || !quantity || quantity <= 0}
          className="w-full"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </CardFooter>
    </Card>
  );
}
