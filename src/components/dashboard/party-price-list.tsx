
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Party, ItemGroup } from '@/lib/types';

interface PartyPriceListProps {
  party?: Party;
  manualPrices: Record<string, number>;
  onPriceChange: (group: string, price: number) => void;
  itemGroups: ItemGroup[];
  canEdit: boolean;
}

export function PartyPriceList({ party, manualPrices, onPriceChange, itemGroups, canEdit }: PartyPriceListProps) {
  
  const allGroupNames = useMemo(() => {
    const groupSet = new Set(itemGroups.map(g => g.name.toLowerCase()));
    Object.keys(manualPrices).forEach(g => groupSet.add(g.toLowerCase()));
    if (manualPrices['u cap'] !== undefined) groupSet.add('u cap');
    if (manualPrices['l cap'] !== undefined) groupSet.add('l cap');
    return Array.from(groupSet);
  }, [itemGroups, manualPrices]);


  if (!party) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Party Price List</CardTitle>
          <CardDescription>Select a party to view and manage their price list.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-4">No party selected.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
      <AccordionItem value="item-1">
        <Card>
          <AccordionTrigger className="p-6">
            <CardHeader className="p-0 text-left">
              <CardTitle>Party Price List</CardTitle>
              <CardDescription>Prices for {party.name}.</CardDescription>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-4">
              {allGroupNames.map(group => (
                <div key={group} className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor={`price-${group}`} className="capitalize">
                    {group}
                  </Label>
                  <Input
                    id={`price-${group}`}
                    type="number"
                    value={manualPrices[group] || ''}
                    onChange={(e) => onPriceChange(group, Number(e.target.value))}
                    placeholder="0.00"
                    disabled={!canEdit}
                    className="text-right"
                  />
                </div>
              ))}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
