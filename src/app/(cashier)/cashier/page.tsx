"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import type { OrderDto } from "@/lib/client-types";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatSom } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Поиск недоступен");
  return response.json() as Promise<OrderDto[]>;
};

export default function CashierPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSWR(query.trim().length > 1 ? `/api/cashier/search?q=${encodeURIComponent(query)}` : null, fetcher);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Кассир</h1>
        <p className="mt-2 text-muted-foreground">Поиск по номеру заказа, QR-коду или email клиента.</p>
      </div>
      <Card className="rounded-lg">
        <CardContent className="flex items-center gap-3 py-4">
          <Search className="size-5 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CP-20260524-000001 или client@demo" className="h-12 text-lg" />
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {isLoading && <Card><CardContent className="py-5 text-muted-foreground">Ищем заказ...</CardContent></Card>}
        {data?.map((order) => (
          <Card key={order.id} className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                <div>{order.client.fullName} · {order.client.email}</div>
                <div>Слот {order.slot.startTime}-{order.slot.endTime} · {formatSom(order.totalAmount)}</div>
              </div>
              <Link href={`/cashier/order/${order.id}`} className="no-underline">
                <Button>Открыть</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && <Card><CardContent className="py-5 text-muted-foreground">Ничего не найдено.</CardContent></Card>}
      </div>
    </div>
  );
}
