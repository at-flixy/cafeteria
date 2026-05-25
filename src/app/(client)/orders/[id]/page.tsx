import QRCode from "qrcode";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderInclude } from "@/lib/orders";
import { formatSom } from "@/lib/money";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: orderInclude });
  if (!order || order.clientId !== session.user.id) notFound();
  const qr = await QRCode.toDataURL(order.orderNumber, { width: 240, margin: 1 });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Заказ #{order.orderNumber}</h1>
          <p className="mt-2 text-muted-foreground">{format(order.createdAt, "dd MMMM yyyy, HH:mm", { locale: ru })}</p>
        </div>
        <Card className="rounded-lg">
          <CardHeader><CardTitle>Состав заказа</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-3 last:border-b-0 last:pb-0">
                <span>{item.menuItem.dish.name} × {item.quantity}</span>
                <span>{formatSom(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Итого</span>
              <span>{formatSom(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="h-fit rounded-lg">
        <CardHeader><CardTitle>QR для кассира</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Image src={qr} alt={`QR ${order.orderNumber}`} width={240} height={240} unoptimized className="rounded-lg border bg-white p-3" />
          <OrderStatusBadge status={order.status} />
          <div className="text-center text-sm text-muted-foreground">Слот {order.slot.startTime}-{order.slot.endTime}</div>
        </CardContent>
      </Card>
    </div>
  );
}
