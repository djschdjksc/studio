
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BillPayment } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface PaymentsSectionProps {
  payments: BillPayment[];
  onPaymentsChange: (payments: BillPayment[]) => void;
  canEdit: boolean;
}

export default function PaymentsSection({ payments, onPaymentsChange, canEdit }: PaymentsSectionProps) {
  
  const handlePaymentChange = (id: string, field: 'amount' | 'description', value: string) => {
    const updatedPayments = payments.map(p => {
      if (p.id === id) {
        if (field === 'amount') {
          return { ...p, amount: value === '' ? '' : Number(value) };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    onPaymentsChange(updatedPayments);
  };

  const removePayment = (id: string) => {
    onPaymentsChange(payments.filter(p => p.id !== id));
  };
  
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Record payments for this bill.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-[15vh]">
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div key={payment.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={payment.amount}
                    onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                    disabled={!canEdit}
                    aria-label="Payment Amount"
                  />
                </div>
                <div className="col-span-6">
                  <Input
                    type="text"
                    placeholder="Description (e.g., Cash, UPI)"
                    value={payment.description}
                    onChange={(e) => handlePaymentChange(payment.id, 'description', e.target.value)}
                    disabled={!canEdit}
                    aria-label="Payment Description"
                  />
                </div>
                <div className="col-span-1">
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => removePayment(payment.id)} aria-label="Remove Payment">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
             {payments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No payments added yet.</p>
             )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
