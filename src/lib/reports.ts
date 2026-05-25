import { addDays, format, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/money";

export type ReportPayload = {
  topDishes: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];
  slotLoad: { slot: string; reserved: number; limit: number }[];
  totals: { orders: number; revenue: number; issued: number };
};

export async function buildReport(type: "daily" | "weekly", date = new Date()): Promise<ReportPayload> {
  const from = type === "weekly" ? startOfWeek(date, { weekStartsOn: 1 }) : new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = type === "weekly" ? addDays(from, 7) : addDays(from, 1);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lt: to } },
    include: {
      slot: true,
      items: { include: { menuItem: { include: { dish: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const dishMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = dishMap.get(item.menuItem.dish.name) ?? { name: item.menuItem.dish.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue = roundMoney(current.revenue + item.unitPrice * item.quantity);
      dishMap.set(item.menuItem.dish.name, current);
    }
  }

  const revenueByDay = [];
  const days = type === "weekly" ? 7 : 1;
  for (let index = 0; index < days; index += 1) {
    const day = addDays(from, index);
    const next = addDays(day, 1);
    const revenue = orders
      .filter((order) => order.createdAt >= day && order.createdAt < next)
      .filter((order) => {
        const paidStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.READY, OrderStatus.ISSUED];
        return paidStatuses.includes(order.status);
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
    revenueByDay.push({ date: format(day, "dd MMM", { locale: ru }), revenue: roundMoney(revenue) });
  }

  const slots = await prisma.timeSlot.findMany({ where: { slotDate: from }, orderBy: { startTime: "asc" } });
  const totals = {
    orders: orders.length,
    revenue: roundMoney(
      orders
        .filter((order) => {
          const paidStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.READY, OrderStatus.ISSUED];
          return paidStatuses.includes(order.status);
        })
        .reduce((sum, order) => sum + order.totalAmount, 0),
    ),
    issued: orders.filter((order) => order.status === OrderStatus.ISSUED).length,
  };

  return {
    topDishes: Array.from(dishMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    revenueByDay,
    slotLoad: slots.map((slot) => ({ slot: `${slot.startTime}-${slot.endTime}`, reserved: slot.reservedCount, limit: slot.orderLimit })),
    totals,
  };
}
