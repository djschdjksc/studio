"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Item } from "@/lib/types"

interface ItemAutocompleteProps {
    id?: string;
    items: Item[];
    value: string;
    onValueChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => void;
}

export function ItemAutocomplete({ id, items, value, onValueChange, onKeyDown }: ItemAutocompleteProps) {
  const [open, setOpen] = React.useState(false)

  const getDisplayText = (val: string) => {
    const item = items.find((item) => item.name.toLowerCase() === val.toLowerCase());
    return item ? item.name : "";
  }
  
  const handleSelect = (currentValue: string) => {
    const selectedItem = items.find(i => i.name.toLowerCase() === currentValue.toLowerCase());
    onValueChange(selectedItem ? selectedItem.name : "")
    setOpen(false)
    
    // Manually trigger focus on the next element if onKeyDown is provided
    const fakeEvent = {
        key: 'Enter',
        preventDefault: () => {},
        currentTarget: document.getElementById(id || ''),
    } as React.KeyboardEvent<HTMLInputElement>;
    
    if (onKeyDown && document.activeElement) {
        // We need to find the button and simulate the event on it.
        const triggerButton = document.getElementById(id || '');
        if (triggerButton) {
            const buttonEvent = {
                key: 'Enter',
                preventDefault: () => {},
                currentTarget: triggerButton,
            } as unknown as React.KeyboardEvent<HTMLButtonElement>;
            onKeyDown(buttonEvent);
        }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onKeyDown={onKeyDown}
        >
          {value
            ? getDisplayText(value)
            : "Select item..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command filter={(value, search) => {
            const item = items.find(i => i.name.toLowerCase() === value.toLowerCase());
            if (item) {
                const nameMatch = item.name.toLowerCase().includes(search.toLowerCase());
                const aliasMatch = item.alias && item.alias.toLowerCase().includes(search.toLowerCase());
                if (nameMatch || aliasMatch) return 1;
            }
            return 0;
        }}>
          <CommandInput placeholder="Search item or alias..." onKeyDown={onKeyDown} />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === item.name.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.alias ? `${item.name} (${item.alias})` : item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
