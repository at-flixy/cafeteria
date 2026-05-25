"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, CreditCard } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function CashierOrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();

  const run = async (url: string, success: string) => {
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json() as { error?: string };
      toast.error(payload.error ?? "Операция не выполнена");
      return;
    }
    toast.success(success);
    router.refresh();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {status === "PENDING_PAYMENT" && (
        <Button size="lg" onClick={() => run(`/api/cashier/orders/${orderId}/cash-paid`, "Оплата принята")}>
          <CreditCard data-icon="inline-start" />
          Принять оплату
        </Button>
      )}
      <Button size="lg" variant="secondary" disabled={status === "ISSUED" || status === "CANCELLED"} onClick={() => run(`/api/cashier/orders/${orderId}/issue`, "Заказ выдан")}>
        <CheckCircle2 data-icon="inline-start" />
        Выдать заказ
      </Button>
    </div>
  );
}
