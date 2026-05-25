"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type QueueSlot = {
  id: string;
  time: string;
  reservedCount: number;
  orderLimit: number;
  dishes: { name: string; quantity: number }[];
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Очередь недоступна");
  return response.json() as Promise<QueueSlot[]>;
};

export default function ManagerQueuePage() {
  const { data } = useSWR("/api/manager/queue", fetcher);

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-3xl font-semibold">Очередь кухни</h1><p className="mt-2 text-muted-foreground">Сводка блюд по каждому слоту на сегодня.</p></div>
      <div className="grid gap-4 xl:grid-cols-5">
        {data?.map((slot) => (
          <Card key={slot.id} className="rounded-lg">
            <CardHeader><CardTitle>{slot.time}<div className="text-sm font-normal text-muted-foreground">{slot.reservedCount}/{slot.orderLimit} заказов</div></CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Блюдо</TableHead><TableHead>×</TableHead></TableRow></TableHeader>
                <TableBody>
                  {slot.dishes.map((dish) => <TableRow key={dish.name}><TableCell>{dish.name}</TableCell><TableCell>{dish.quantity}</TableCell></TableRow>)}
                  {slot.dishes.length === 0 && <TableRow><TableCell colSpan={2} className="text-muted-foreground">Нет заказов</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
