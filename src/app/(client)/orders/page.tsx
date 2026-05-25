"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { QrCode, XCircle } from "lucide-react";
import type { OrderDto } from "@/lib/client-types";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatSom } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Не удалось загрузить заказы");
  return response.json() as Promise<OrderDto[]>;
};

export default function OrdersPage() {
  const { data, mutate, isLoading } = useSWR("/api/orders/mine", fetcher);

  const cancel = async (id: string) => {
    const response = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json() as { error?: string };
      toast.error(payload.error ?? "Не удалось отменить заказ");
      return;
    }
    toast.success("Заказ отменён");
    await mutate();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold">Мои заказы</h1>
        <p className="mt-2 text-muted-foreground">История предзаказов и QR-коды для выдачи.</p>
      </div>
      <Card className="rounded-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Слот</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Загружаем...</TableCell></TableRow>}
              {data?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}<div className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM HH:mm", { locale: ru })}</div></TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell>{order.slot.startTime}-{order.slot.endTime}</TableCell>
                  <TableCell>{formatSom(order.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {["CREATED", "PENDING_PAYMENT"].includes(order.status) && (
                        <Button variant="outline" size="sm" onClick={() => cancel(order.id)}>
                          <XCircle data-icon="inline-start" />
                          Отменить
                        </Button>
                      )}
                      <Link href={`/orders/${order.id}`} className="no-underline">
                        <Button size="sm">
                          <QrCode data-icon="inline-start" />
                          QR
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && <TableRow><TableCell colSpan={5}>Заказов пока нет.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
