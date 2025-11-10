"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Item, SavedLoadingSlip, WithId } from "@/lib/types";
import { format } from "date-fns";
import { useMemo } from "react";
import { Trash2, FileText } from "lucide-react";

interface AllLoadingSlipsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savedSlips: Record<string, WithId<SavedLoadingSlip>>;
  onLoadSlip: (slipNo: string) => void;
  onDeleteSlip: (slipNo: string) => void;
  items: Item[];
  canDelete: boolean;
}

const calculateTotalQuantity = (slip: SavedLoadingSlip): number => {
    return slip.billingItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
};


export function AllLoadingSlipsDialog({
  isOpen,
  onClose,
  savedSlips,
  onLoadSlip,
  onDeleteSlip,
  items,
  canDelete,
}: AllLoadingSlipsDialogProps) {

  const slipsArray = useMemo(() => {
    return Object.values(savedSlips)
      .map((slip) => ({
        ...slip,
        totalQuantity: calculateTotalQuantity(slip),
      }))
      .sort((a, b) => Number(b.filters.slipNo) - Number(a.filters.slipNo));
  }, [savedSlips, items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>All Saved Loading Slips</DialogTitle>
          <DialogDescription>
            Here you can view, load, or delete any of your previously saved loading slips.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] border-t">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[100px]">Slip No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead className="text-right">Total Quantity</TableHead>
                <TableHead className="text-center w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slipsArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No saved slips found.
                  </TableCell>
                </TableRow>
              ) : (
                slipsArray.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.filters.slipNo}</TableCell>
                    <TableCell>
                      {slip.filters.date
                        ? format(new Date(slip.filters.date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{slip.filters.partyName}</TableCell>
                    <TableCell className="text-right font-semibold">
                       {slip.totalQuantity.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLoadSlip(slip.filters.slipNo)}
                          className="mr-2"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        {canDelete && (
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1"/>
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the loading slip with Slip No. <span className="font-bold">{slip.filters.slipNo}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteSlip(slip.filters.slipNo)}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
