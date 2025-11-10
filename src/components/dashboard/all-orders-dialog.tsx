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
import { Item, SavedOrder, WithId } from "@/lib/types";
import { format } from "date-fns";
import { useMemo } from "react";
import { Trash2, FileText, FileCheck } from "lucide-react";
import { Badge } from "../ui/badge";

interface AllOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savedOrders: Record<string, WithId<SavedOrder>>;
  onLoadOrder: (slipNo: string) => void;
  onDeleteOrder: (slipNo: string) => void;
  onConvertToBill: (slipNo: string) => void;
  items: Item[];
  canDelete: boolean;
}

const calculateGrandTotal = (order: SavedOrder, items: Item[]): number => {
    const summaryMap = new Map<string, { totalQty: number }>();
    order.billingItems.forEach((billItem) => {
      const itemInfo = items.find((i) => i.name.toLowerCase() === billItem.itemName.toLowerCase());
      if (!itemInfo || !billItem.quantity || !itemInfo.group) return;
      const group = itemInfo.group;
      if (summaryMap.has(group)) {
        summaryMap.get(group)!.totalQty += billItem.quantity;
      } else {
        summaryMap.set(group, { totalQty: billItem.quantity });
      }
    });

    const uCapTotal = order.billingItems.reduce((sum, item) => sum + (item.uCap || 0), 0);
    const lCapTotal = order.billingItems.reduce((sum, item) => sum + (item.lCap || 0), 0);

    const allSummaryItems = Array.from(summaryMap.entries()).map(([item, data]) => {
      const groupKey = item.toLowerCase();
      const price = order.manualPrices[groupKey] !== undefined ? order.manualPrices[groupKey] : 0;
      return {
        totalPrice: data.totalQty * price,
      };
    });

    const uCapPrice = order.manualPrices["u cap"] !== undefined ? order.manualPrices["u cap"] : 0;
    if (uCapTotal > 0 || order.manualPrices["u cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: uCapTotal * uCapPrice,
      });
    }

    const lCapPrice = order.manualPrices["l cap"] !== undefined ? order.manualPrices["l cap"] : 0;
    if (lCapTotal > 0 || order.manualPrices["l cap"] !== undefined) {
      allSummaryItems.push({
        totalPrice: lCapTotal * lCapPrice,
      });
    }

    return allSummaryItems.reduce((acc, item) => acc + item.totalPrice, 0);
};

export function AllOrdersDialog({
  isOpen,
  onClose,
  savedOrders,
  onLoadOrder,
  onDeleteOrder,
  onConvertToBill,
  items,
  canDelete,
}: AllOrdersDialogProps) {

  const ordersArray = useMemo(() => {
    return Object.values(savedOrders)
      .map((order) => ({
        ...order,
        grandTotal: calculateGrandTotal(order, items),
      }))
      .sort((a, b) => Number(b.filters.slipNo) - Number(a.filters.slipNo));
  }, [savedOrders, items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>All Saved Orders</DialogTitle>
          <DialogDescription>
            Here you can view, load, delete, or convert any of your previously saved orders.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] border-t">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[100px]">Order No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-center w-[300px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No saved orders found.
                  </TableCell>
                </TableRow>
              ) : (
                ordersArray.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.filters.slipNo}</TableCell>
                    <TableCell>
                      {order.filters.date
                        ? format(new Date(order.filters.date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{order.filters.partyName}</TableCell>
                    <TableCell>
                        <Badge variant={order.filters.orderStatus === 'completed' ? 'secondary' : 'default'}>
                            {order.filters.orderStatus}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                       ₹{order.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onConvertToBill(order.filters.slipNo)}
                          disabled={order.filters.orderStatus === 'completed'}
                        >
                          <FileCheck className="h-4 w-4 mr-1" />
                          Convert to Bill
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLoadOrder(order.filters.slipNo)}
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
                                    This action cannot be undone. This will permanently delete the order with Slip No. <span className="font-bold">{order.filters.slipNo}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteOrder(order.filters.slipNo)}>
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
