
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Party, SearchFiltersState } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { PartySearchInput } from "./party-search-input";
import { format, parseISO } from "date-fns";

interface SearchFiltersProps {
  parties: Party[];
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  onLoadBill: () => void;
  canEdit: boolean;
}

export default function SearchFilters({ parties, filters, onFiltersChange, onLoadBill, canEdit }: SearchFiltersProps) {

  const handleFieldChange = (field: keyof SearchFiltersState, value: any) => {
    const newFilters = { ...filters, [field]: value };
    
    if (field === 'partyName') {
      const party = parties.find(p => p.name.toLowerCase() === String(value).toLowerCase());
      if (party) {
        newFilters.address = `${party.address || ''}${party.address && (party.district || party.state || party.pincode) ? ', ' : ''}${party.district || ''}${party.district && (party.state || party.pincode) ? ', ' : ''}${party.state || ''}${party.state && party.pincode ? ' - ' : ''}${party.pincode || ''}`.replace(/, ,/g, ',').replace(/^,|,$/g, '');
      } else {
        newFilters.address = "";
      }
    }

    onFiltersChange(newFilters);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    const date = dateValue ? new Date(dateValue) : undefined;
    // Adjust for timezone offset
    const timezoneOffset = date ? date.getTimezoneOffset() * 60000 : 0;
    const adjustedDate = date ? new Date(date.getTime() + timezoneOffset) : undefined;

    onFiltersChange({ ...filters, date: adjustedDate });
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
        <CardTitle>Search & Filters</CardTitle>
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
            <Label htmlFor="slipNo">Slip No</Label>
            <div className="flex items-center gap-2">
              <Input id="slipNo" placeholder="Enter slip no..." value={filters.slipNo} onChange={e => handleFieldChange('slipNo', e.target.value)} disabled={!canEdit} />
              <Button size="icon" variant="outline" onClick={onLoadBill} aria-label="Load Bill">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleNo">Vehicle No</Label>
            <Input id="vehicleNo" placeholder="Enter vehicle no..." value={filters.vehicleNo} onChange={e => handleFieldChange('vehicleNo', e.target.value)} disabled={!canEdit} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select onValueChange={(val) => handleFieldChange('vehicleType', val)} value={filters.vehicleType} disabled={!canEdit}>
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">SELF</SelectItem>
                <SelectItem value="truck">TRUCK</SelectItem>
                <SelectItem value="rikshaw">RIKSHAW</SelectItem>
                <SelectItem value="e-rikshaw">E-RIKSHAW</SelectItem>
                <SelectItem value="by canter">BY CANTER</SelectItem>
                <SelectItem value="by jeep">BY JEEP</SelectItem>
                <SelectItem value="by auto">BY AUTO</SelectItem>
                <SelectItem value="by tempo">BY TEMPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="billType">Bill Type</Label>
            <Select onValueChange={(val) => handleFieldChange('billType', val)} value={filters.billType} disabled={!canEdit}>
              <SelectTrigger id="billType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="sale-return">Sale Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-full xl:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Enter any notes for the bill..." value={filters.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)} className="h-10 resize-none" disabled={!canEdit} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
