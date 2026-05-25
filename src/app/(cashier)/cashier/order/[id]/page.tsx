import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { CashierOrderActions } from "@/components/CashierOrderActions";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatSom } from "@/lib/money";
import { orderInclude } from "@/lib/orders";
import { requireRole } from "@/lib/rbac";

export default async function CashierOrderPage({ params }: { params: { id: string } }) {
  await requireRole([Role.CASHIER]);
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: orderInclude });
  if (!order) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Заказ #{order.orderNumber}</h1>
          <p className="mt-2 text-muted-foreground">{order.client.fullName} · {order.client.email}</p>
        </div>
        <Card className="rounded-lg">
          <CardHeader><CardTitle>Позиции</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-3 last:border-b-0 last:pb-0">
                <span>{item.menuItem.dish.name} × {item.quantity}</span>
                <span>{formatSom(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="h-fit rounded-lg">
        <CardHeader><CardTitle>Выдача</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><span>Статус</span><OrderStatusBadge status={order.status} /></div>
          <div className="flex justify-between"><span>Слот</span><span>{order.slot.startTime}-{order.slot.endTime}</span></div>
          <div className="flex justify-between text-lg font-semibold"><span>Итого</span><span>{formatSom(order.totalAmount)}</span></div>
          <CashierOrderActions orderId={order.id} status={order.status} />
        </CardContent>
      </Card>
    </div>
  );
}
