"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Party, SearchFiltersState } from "@/lib/types";

interface SearchFiltersProps {
  parties: Party[];
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
}

export default function SearchFilters({ parties, filters, onFiltersChange }: SearchFiltersProps) {

  const handleFieldChange = (field: keyof SearchFiltersState, value: any) => {
    const newFilters = { ...filters, [field]: value };
    
    if (field === 'partyName') {
      const party = parties.find(p => p.name === value);
      if (party) {
        newFilters.address = party.address;
      } else {
        newFilters.address = "";
      }
    }

    onFiltersChange(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search & Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="partyName">Party Name</Label>
            <Select onValueChange={(val) => handleFieldChange('partyName', val)} value={filters.partyName}>
                <SelectTrigger id="partyName">
                    <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                    {parties.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter address..." value={filters.address} onChange={e => handleFieldChange('address', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker date={filters.date} onDateChange={(date) => handleFieldChange('date', date)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slipNo">Slip No</Label>
            <Input id="slipNo" placeholder="Enter slip no..." value={filters.slipNo} onChange={e => handleFieldChange('slipNo', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleNo">Vehicle No</Label>
            <Input id="vehicleNo" placeholder="Enter vehicle no..." value={filters.vehicleNo} onChange={e => handleFieldChange('vehicleNo', e.target.value)}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select onValueChange={(val) => handleFieldChange('vehicleType', val)} value={filters.vehicleType}>
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
          <div className="space-y-2">
            <Label htmlFor="billType">Bill Type</Label>
            <Select onValueChange={(val) => handleFieldChange('billType', val)} value={filters.billType}>
              <SelectTrigger id="billType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="sale-return">Sale Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full xl:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
