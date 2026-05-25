import Link from "next/link";
import { Role } from "@prisma/client";
import { BarChart3, Clock, ListChecks, Soup } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getManagerDashboard } from "@/lib/orders";
import { formatSom } from "@/lib/money";

export default async function ManagerDashboardPage() {
  const data = await getManagerDashboard();
  return (
    <RoleGuard roles={[Role.MANAGER, Role.ADMIN]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Дашборд менеджера</h1>
            <p className="mt-2 text-muted-foreground">Контроль меню, очереди и продаж за сегодня.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/manager/menu" className="no-underline"><Button>Меню дня</Button></Link>
            <Link href="/manager/dishes" className="no-underline"><Button variant="outline">Блюда</Button></Link>
            <Link href="/manager/slots" className="no-underline"><Button variant="outline">Слоты</Button></Link>
            <Link href="/manager/reports" className="no-underline"><Button variant="outline">Отчёты</Button></Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-5 text-primary" />Заказы</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.orders.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" />Выручка</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatSom(data.revenue)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-5 text-primary" />Слоты</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.slots.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Soup className="size-5 text-primary" />События</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.notifications}</CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader><CardTitle>Загрузка слотов</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <span>{slot.startTime}-{slot.endTime}</span>
                  <span className="font-medium">{slot.reservedCount}/{slot.orderLimit}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader><CardTitle>Остатки с низким запасом</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <span>{item.dish.name}</span>
                  <span className="font-medium">{item.availableQty - item.reservedQty} порций</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
