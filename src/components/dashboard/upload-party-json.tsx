
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Party } from "@/lib/types";
import { UploadCloud } from "lucide-react";
import { useRef } from "react";

interface UploadPartyJsonProps {
  onUpload: (parties: Omit<Party, 'id'>[]) => void;
}

export function UploadPartyJson({ onUpload }: UploadPartyJsonProps) {
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
        
        let partiesToUpload: Omit<Party, 'id'>[] = [];

        // Check if it's a full backup file
        if(json.parties && Array.isArray(json.parties)) {
            partiesToUpload = json.parties;
        } else if (Array.isArray(json)) { // Check if it's just a party array
            partiesToUpload = json;
        } else {
            throw new Error("Invalid JSON format. Expects an array of parties or a backup file with a 'parties' key.");
        }

        // Basic validation
        if (!partiesToUpload.every(item => typeof item.name === 'string')) {
            throw new Error("Invalid party data. Each party must have at least a 'name' property.");
        }
        
        const finalParties = partiesToUpload.map(party => ({
            name: party.name,
            address: party.address || "",
            phone: party.phone || "",
        }))

        onUpload(finalParties);

      } catch (error) {
        console.error("Error parsing JSON file:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error instanceof Error ? error.message : "Could not read or parse the selected file.",
        });
      } finally {
        // Reset file input so the same file can be selected again
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
        Restore Parties
      </Button>
    </>
  );
}
