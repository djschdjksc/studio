
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/lib/types";
import { Upload } from "lucide-react";
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

        // Basic validation
        if (!Array.isArray(json) || !json.every(item => typeof item.name === 'string' && typeof item.group === 'string' && typeof item.unit === 'string')) {
            throw new Error("Invalid JSON format for items. Expects an array of objects with name, group, and unit.");
        }
        
        const itemsToUpload = json.map(item => ({
            name: item.name,
            group: item.group,
            unit: item.unit,
            alias: item.alias || "",
        }))

        onUpload(itemsToUpload);

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
        <Upload className="mr-2 h-4 w-4" />
        Upload Item JSON
      </Button>
    </>
  );
}
