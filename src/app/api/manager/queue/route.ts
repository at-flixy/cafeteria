import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/dates";
import { errorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    await requireRole([Role.MANAGER]);
    const slots = await prisma.timeSlot.findMany({
      where: { slotDate: startOfLocalDay() },
      include: {
        orders: {
          include: { items: { include: { menuItem: { include: { dish: true } } } } },
        },
      },
      orderBy: { startTime: "asc" },
    });
    const queue = slots.map((slot) => {
      const dishMap = new Map<string, number>();
      for (const order of slot.orders) {
        if (order.status === "CANCELLED") continue;
        for (const item of order.items) {
          dishMap.set(item.menuItem.dish.name, (dishMap.get(item.menuItem.dish.name) ?? 0) + item.quantity);
        }
      }
      return {
        id: slot.id,
        time: `${slot.startTime}-${slot.endTime}`,
        reservedCount: slot.reservedCount,
        orderLimit: slot.orderLimit,
        dishes: Array.from(dishMap.entries()).map(([name, quantity]) => ({ name, quantity })),
      };
    });
    return Response.json(queue);
  } catch (error) {
    return errorResponse(error);
  }
}
