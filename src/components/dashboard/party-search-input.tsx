"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Party } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PartySearchInputProps {
    id: string;
    parties: Party[];
    value: string;
    onValueChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

export function PartySearchInput({ id, parties, value, onValueChange, onKeyDown, disabled }: PartySearchInputProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    onValueChange(query);

    if (query.length > 0) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredSuggestions = parties.filter(
        party =>
          party.name.toLowerCase().includes(lowerCaseQuery) ||
          party.station.toLowerCase().includes(lowerCaseQuery)
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveIndex(-1); 
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (partyName: string) => {
    setInputValue(partyName);
    onValueChange(partyName);
    setShowSuggestions(false);
    
    setTimeout(() => {
        const fakeEvent = {
            key: 'Enter',
            preventDefault: () => {},
            currentTarget: inputRef.current,
        } as unknown as React.KeyboardEvent<HTMLInputElement>;
        if (onKeyDown) {
            onKeyDown(fakeEvent);
        }
    }, 0);
  };
  
  const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
        return;
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          e.preventDefault();
          handleSelect(suggestions[activeIndex].name);
        } else if (suggestions.length > 0 && activeIndex === -1 && inputValue) {
          e.preventDefault();
          handleSelect(suggestions[0].name);
        } else {
            setShowSuggestions(false);
            if(onKeyDown) onKeyDown(e);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveIndex(-1);
        return;
      }
    }
    if(onKeyDown) onKeyDown(e);
  };

  return (
    <div className="relative w-full">
      <Input
        id={id}
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleLocalKeyDown}
        onFocus={() => {
          if (value) handleChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)
        }}
        onBlur={() => {
            setTimeout(() => {
                setShowSuggestions(false);
                if (!parties.some(p => p.name.toLowerCase() === inputValue.toLowerCase())) {
                   onValueChange(value);
                }
            }, 150);
        }}
        placeholder="Type to search party..."
        autoComplete="off"
        className="w-full"
        disabled={disabled}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {suggestions.map((party, index) => (
              <li
                key={party.id}
                onMouseDown={() => handleSelect(party.name)}
                className={cn(
                  "cursor-pointer p-2 hover:bg-accent",
                  index === activeIndex && "bg-accent"
                )}
              >
                <div className="font-medium">{party.name}</div>
                <div className="text-xs text-muted-foreground">{party.station}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
