
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ItemSearchInputProps {
    id: string;
    items: Item[];
    value: string;
    onValueChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ItemSearchInput({ id, items, value, onValueChange, onKeyDown }: ItemSearchInputProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<Item[]>([]);
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
      const filteredSuggestions = items.filter(
        item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          (item.alias && item.alias.toLowerCase().includes(query.toLowerCase()))
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveIndex(-1); 
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (itemName: string) => {
    setInputValue(itemName);
    onValueChange(itemName);
    setShowSuggestions(false);
    
    // This part is crucial to pass the 'Enter' key press to the parent component
    // after a selection is made, so it can move to the next cell.
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
          // If user presses enter without navigating, but there are suggestions, select the first one
          e.preventDefault();
          handleSelect(suggestions[0].name);
        } else {
            // Let the default onKeyDown handler take over to move to the next cell
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
    // Pass all other keydowns to the parent handler (for arrow left/right etc)
    if(onKeyDown) onKeyDown(e);
  };

  return (
    <div className="relative w-full">
      <Input
        id={id} // Pass the id directly to the input for focus management
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleLocalKeyDown}
        onFocus={() => {
          if (value) handleChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)
        }}
        onBlur={() => {
            // Give time for select to register before hiding
            setTimeout(() => {
                setShowSuggestions(false);
                 // Don't reset if value is valid. This prevents flickering.
                if (!items.some(i => i.name.toLowerCase() === inputValue.toLowerCase())) {
                   onValueChange(value); // Revert to original value if blur happens without selection
                }
            }, 150);
        }}
        placeholder="Type to search..."
        autoComplete="off"
        className="w-full"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item.name)}
                className={cn(
                  "cursor-pointer p-2 hover:bg-accent",
                  index === activeIndex && "bg-accent"
                )}
              >
                {item.alias ? `${item.name} (${item.alias})` : item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
