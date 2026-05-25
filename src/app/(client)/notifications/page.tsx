"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { NotificationDto } from "@/lib/client-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Не удалось загрузить уведомления");
  return response.json() as Promise<NotificationDto[]>;
};

export default function NotificationsPage() {
  const { data, mutate } = useSWR("/api/notifications", fetcher);
  const read = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await mutate();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold">Уведомления</h1>
        <p className="mt-2 text-muted-foreground">In-app сообщения по заказам, оплатам и стоп-листу.</p>
      </div>
      <div className="flex flex-col gap-3">
        {data?.map((item) => (
          <Card key={item.id} className="rounded-lg">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {!item.readAt && <Badge className="bg-primary text-primary-foreground">новое</Badge>}
                  <span className="font-medium">{item.message}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ru })}</div>
              </div>
              {!item.readAt && <Button variant="outline" onClick={() => read(item.id)}>Прочитать</Button>}
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && <Card><CardContent className="py-8 text-muted-foreground">Уведомлений нет.</CardContent></Card>}
      </div>
    </div>
  );
}
