"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Party, OrderFiltersState } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { PartySearchInput } from "./party-search-input";
import { format, parseISO } from "date-fns";

interface OrderSearchFiltersProps {
  parties: Party[];
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  onLoadOrder: () => void;
  canEdit: boolean;
}

export default function OrderSearchFilters({ parties, filters, onFiltersChange, onLoadOrder, canEdit }: OrderSearchFiltersProps) {

  const handleFieldChange = (field: keyof OrderFiltersState, value: any) => {
    const newFilters = { ...filters, [field]: value };
    
    if (field === 'partyName') {
      const party = parties.find(p => p.name.toLowerCase() === String(value).toLowerCase());
      if (party) {
        newFilters.address = `${party.address}, ${party.district}, ${party.state} - ${party.pincode}`;
      } else {
        newFilters.address = "";
      }
    }

    onFiltersChange(newFilters);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    onFiltersChange({ ...filters, date: dateValue ? new Date(dateValue) : undefined });
  }
  
  const getDateValue = () => {
    if (!filters.date) return "";
    try {
        const date = typeof filters.date === 'string' ? parseISO(filters.date) : filters.date;
        return format(date, 'yyyy-MM-dd');
    } catch {
        return "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="space-y-2 col-span-2 xl:col-span-1">
            <Label htmlFor="partyName">Party Name</Label>
            <PartySearchInput
                id="partyName"
                parties={parties}
                value={filters.partyName}
                onValueChange={(value) => handleFieldChange('partyName', value)}
                disabled={!canEdit}
            />
          </div>
          <div className="space-y-2 col-span-2 xl:col-span-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter address..." value={filters.address} onChange={e => handleFieldChange('address', e.target.value)} disabled={!canEdit} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="date">Date</Label>
             <Input id="date" type="date" value={getDateValue()} onChange={handleDateChange} disabled={!canEdit} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="slipNo">Order No</Label>
            <div className="flex items-center gap-2">
              <Input id="slipNo" placeholder="Enter order no..." value={filters.slipNo} onChange={e => handleFieldChange('slipNo', e.target.value)} disabled={!canEdit} />
              <Button size="icon" variant="outline" onClick={onLoadOrder} aria-label="Load Order">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 col-span-full xl:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Enter any notes for the order..." value={filters.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)} className="h-10 resize-none" disabled={!canEdit} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
