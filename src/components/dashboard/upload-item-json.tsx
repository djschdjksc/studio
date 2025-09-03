
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/lib/types";
import { UploadCloud } from "lucide-react";
import { useRef } from "react";

interface UploadItemJsonProps {
  onUpload: (items: Omit<Item, 'id' | 'price'>[]) => void;
}

export function UploadItemJson({ onUpload }: UploadItemJsonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("File content is not a string");
        }
        const json = JSON.parse(text);

        let itemsToUpload: Omit<Item, 'id' | 'price'>[] = [];

        // Check if it's a full backup file
        if(json.items && Array.isArray(json.items)) {
            itemsToUpload = json.items;
        } else if (Array.isArray(json)) { // Check if it's just an items array
            itemsToUpload = json;
        } else {
            throw new Error("Invalid JSON format. Expects an array of items or a backup file with an 'items' key.");
        }


        // Basic validation
        if (!itemsToUpload.every(item => typeof item.name === 'string' && typeof item.group === 'string' && typeof item.unit === 'string')) {
            throw new Error("Invalid item data. Each item must have name, group, and unit.");
        }
        
        const finalItems = itemsToUpload.map(item => ({
            name: item.name,
            group: item.group,
            unit: item.unit,
            alias: item.alias || "",
        }))

        onUpload(finalItems);

      } catch (error) {
        console.error("Error parsing JSON file:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error instanceof Error ? error.message : "Could not read or parse the selected file.",
        });
      } finally {
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
         toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Failed to read the file.",
        });
    }
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />
      <Button onClick={handleButtonClick} variant="outline">
        <UploadCloud className="mr-2 h-4 w-4" />
        Restore Items
      </Button>
    </>
  );
}
