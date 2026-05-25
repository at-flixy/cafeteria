import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels: Record<OrderStatus, string> = {
  CREATED: "Создан",
  PENDING_PAYMENT: "Оплата на кассе",
  PAID: "Оплачен",
  READY: "Готов",
  ISSUED: "Выдан",
  CANCELLED: "Отменён",
};

const classes: Record<OrderStatus, string> = {
  CREATED: "bg-amber-100 text-amber-900",
  PENDING_PAYMENT: "bg-orange-100 text-orange-900",
  PAID: "bg-emerald-100 text-emerald-900",
  READY: "bg-sky-100 text-sky-900",
  ISSUED: "bg-stone-900 text-white",
  CANCELLED: "bg-red-100 text-red-900",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={cn("border-transparent", classes[status])}>{labels[status]}</Badge>;
}
