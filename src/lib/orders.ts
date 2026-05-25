import { OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { auditLog } from "@/lib/audit";
import { startOfLocalDay, slotStartAt } from "@/lib/dates";
import { ForbiddenError, NotFoundError, OutOfStockError, SlotFullError, AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";
import { notifyUser } from "@/lib/notifications";
import { mockOnlinePayment } from "@/lib/payments";
import { prisma } from "@/lib/db";

export type OrderInputItem = {
  menuItemId: string;
  quantity: number;
};

const activeOrderStatuses: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
];

export function generateOrderNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CP-${stamp}-${random}`;
}

export async function createOrder(clientId: string, slotId: string, items: OrderInputItem[]) {
  if (items.length === 0) {
    throw new AppError("Корзина пуста", "EMPTY_CART", 400);
  }

  const normalized = items.reduce<Map<string, number>>((map, item) => {
    map.set(item.menuItemId, (map.get(item.menuItemId) ?? 0) + item.quantity);
    return map;
  }, new Map<string, number>());

  return prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundError("Слот не найден");
    if (slot.reservedCount >= slot.orderLimit) throw new SlotFullError();

    const menuItems = await tx.menuItem.findMany({
      where: { id: { in: Array.from(normalized.keys()) } },
      include: { dish: true },
    });
    if (menuItems.length !== normalized.size) throw new NotFoundError("Позиция меню не найдена");

    for (const menuItem of menuItems) {
      const quantity = normalized.get(menuItem.id) ?? 0;
      const available = menuItem.availableQty - menuItem.reservedQty;
      if (menuItem.stopListFlag || available < quantity) {
        throw new OutOfStockError(`Недостаточно порций: ${menuItem.dish.name}`);
      }
    }

    const totalAmount = roundMoney(
      menuItems.reduce((sum, menuItem) => sum + menuItem.price * (normalized.get(menuItem.id) ?? 0), 0),
    );

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        clientId,
        slotId,
        totalAmount,
        status: OrderStatus.CREATED,
        items: {
          create: menuItems.map((menuItem) => ({
            menuItemId: menuItem.id,
            quantity: normalized.get(menuItem.id) ?? 0,
            unitPrice: menuItem.price,
          })),
        },
      },
      include: {
        items: { include: { menuItem: { include: { dish: true } } } },
        slot: true,
        payment: true,
      },
    });

    for (const menuItem of menuItems) {
      await tx.menuItem.update({
        where: { id: menuItem.id },
        data: { reservedQty: { increment: normalized.get(menuItem.id) ?? 0 } },
      });
    }

    await tx.timeSlot.update({ where: { id: slotId }, data: { reservedCount: { increment: 1 } } });
    await notifyUser(tx, clientId, `Заказ #${order.orderNumber} создан`, "ORDER");
    await auditLog(tx, clientId, "order_created", "Order", order.id, { orderNumber: order.orderNumber });
    return order;
  });
}

export async function payOrder(orderId: string, method: "ONLINE" | "CASH") {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new NotFoundError("Заказ не найден");
  const payableStatuses: OrderStatus[] = [OrderStatus.CREATED, OrderStatus.PENDING_PAYMENT];
  if (!payableStatuses.includes(order.status)) {
    throw new AppError("Заказ нельзя оплатить в текущем статусе", "ORDER_NOT_PAYABLE", 409);
  }

  if (method === "CASH") {
    return prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { orderId },
        update: { method: "CASH", status: PaymentStatus.PENDING },
        create: { orderId, method: "CASH", status: PaymentStatus.PENDING },
      });
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING_PAYMENT },
        include: orderInclude,
      });
      await notifyUser(tx, order.clientId, "Оплатите на кассе при получении", "PAYMENT");
      return updated;
    });
  }

  await prisma.payment.upsert({
    where: { orderId },
    update: { method: "ONLINE", status: PaymentStatus.PENDING },
    create: { orderId, method: "ONLINE", status: PaymentStatus.PENDING },
  });

  const paid = await mockOnlinePayment(orderId);

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        method: paid.method,
        status: paid.status,
        providerRef: paid.providerRef,
        paidAt: paid.paidAt,
      },
    });
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: orderInclude,
    });
    await notifyUser(tx, order.clientId, "Оплата прошла", "PAYMENT");
    await auditLog(tx, order.clientId, "order_paid", "Order", order.id, { method });
    return updated;
  });
}

export async function markCashPaid(orderId: string, cashierId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Заказ не найден");
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new AppError("Заказ не ожидает оплату на кассе", "ORDER_NOT_PENDING_CASH", 409);
    }
    await tx.payment.upsert({
      where: { orderId },
      update: { method: "CASH", status: PaymentStatus.SUCCESS, paidAt: new Date() },
      create: { orderId, method: "CASH", status: PaymentStatus.SUCCESS, paidAt: new Date() },
    });
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID }, include: orderInclude });
    await notifyUser(tx, order.clientId, `Оплата заказа #${order.orderNumber} принята`, "PAYMENT");
    await auditLog(tx, cashierId, "cash_payment_received", "Order", order.id);
    return updated;
  });
}

export async function cancelOrder(orderId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, slot: true },
    });
    if (!order) throw new NotFoundError("Заказ не найден");
    if (order.clientId !== actorId) throw new ForbiddenError("Можно отменить только свой заказ");
    const blockedStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.READY, OrderStatus.ISSUED, OrderStatus.CANCELLED];
    if (blockedStatuses.includes(order.status)) {
      throw new AppError("Заказ уже нельзя отменить", "ORDER_NOT_CANCELLABLE", 409);
    }
    if (slotStartAt(order.slot.slotDate, order.slot.startTime).getTime() <= Date.now()) {
      throw new AppError("Слот уже начался, отмена недоступна", "SLOT_ALREADY_STARTED", 409);
    }

    for (const item of order.items) {
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { reservedQty: { decrement: item.quantity } },
      });
    }

    await tx.timeSlot.update({ where: { id: order.slotId }, data: { reservedCount: { decrement: 1 } } });
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED }, include: orderInclude });
    await notifyUser(tx, order.clientId, `Заказ #${order.orderNumber} отменён`, "ORDER");
    await auditLog(tx, actorId, "order_cancelled", "Order", order.id);
    return updated;
  });
}

export async function issueOrder(orderId: string, cashierId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    if (!order) throw new NotFoundError("Заказ не найден");

    if (order.status === OrderStatus.PENDING_PAYMENT) {
      await tx.payment.upsert({
        where: { orderId },
        update: { method: "CASH", status: PaymentStatus.SUCCESS, paidAt: new Date() },
        create: { orderId, method: "CASH", status: PaymentStatus.SUCCESS, paidAt: new Date() },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });
    } else if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.READY) {
      throw new AppError("К выдаче доступны только оплаченные заказы", "ORDER_NOT_ISSUABLE", 409);
    }

    for (const item of order.items) {
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { availableQty: { decrement: item.quantity } },
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ISSUED, issuedAt: new Date(), issuedById: cashierId },
      include: orderInclude,
    });
    await notifyUser(tx, order.clientId, `Заказ #${order.orderNumber} выдан`, "ORDER");
    await auditLog(tx, cashierId, "order_issued", "Order", order.id);
    return updated;
  });
}

export async function toggleStopList(menuItemId: string, value: boolean, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.update({
      where: { id: menuItemId },
      data: { stopListFlag: value },
      include: { dish: true },
    });

    if (value) {
      const impactedOrders = await tx.order.findMany({
        where: {
          status: { in: activeOrderStatuses },
          items: { some: { menuItemId } },
        },
        select: { id: true, clientId: true },
      });
      for (const order of impactedOrders) {
        await notifyUser(tx, order.clientId, `Блюдо ${item.dish.name} временно недоступно, свяжитесь с кассой`, "STOP_LIST");
      }
    }

    await auditLog(tx, actorId, "stop_list_toggled", "MenuItem", menuItemId, { value });
    return item;
  });
}

export async function setSlotLimit(slotId: string, newLimit: number, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundError("Слот не найден");
    if (newLimit < slot.reservedCount) {
      throw new AppError("Лимит не может быть меньше уже занятых мест", "SLOT_LIMIT_TOO_LOW", 409);
    }
    const updated = await tx.timeSlot.update({ where: { id: slotId }, data: { orderLimit: newLimit } });
    await auditLog(tx, actorId, "slot_limit_changed", "TimeSlot", slotId, { from: slot.orderLimit, to: newLimit });
    return updated;
  });
}

export async function getTodayMenu() {
  const today = startOfLocalDay();
  const menu = await prisma.dailyMenu.findUnique({
    where: { menuDate: today },
    include: {
      items: {
        orderBy: { dish: { name: "asc" } },
        include: { dish: true },
      },
    },
  });
  const slots = await prisma.timeSlot.findMany({ where: { slotDate: today }, orderBy: { startTime: "asc" } });
  return { menu, slots };
}

export const orderInclude = {
  client: { select: { id: true, fullName: true, email: true, role: true } },
  cashier: { select: { id: true, fullName: true, email: true, role: true } },
  slot: true,
  items: { include: { menuItem: { include: { dish: true } } } },
  payment: true,
} satisfies Prisma.OrderInclude;

export async function searchCashierOrders(query: string) {
  const q = query.trim();
  if (!q) return [];
  return prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { contains: q } },
        { id: q },
        { client: { email: { contains: q } } },
      ],
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getManagerDashboard() {
  const today = startOfLocalDay();
  const [orders, slots, lowStock, notifications] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: today } }, include: { payment: true } }),
    prisma.timeSlot.findMany({ where: { slotDate: today }, orderBy: { startTime: "asc" } }),
    prisma.menuItem.findMany({ where: { menu: { menuDate: today }, stopListFlag: false }, include: { dish: true }, orderBy: { availableQty: "asc" }, take: 5 }),
    prisma.notification.count({ where: { createdAt: { gte: today } } }),
  ]);
  const revenue = orders
      .filter((order) => {
        const paidStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.READY, OrderStatus.ISSUED];
        return paidStatuses.includes(order.status);
      })
    .reduce((sum, order) => sum + order.totalAmount, 0);
  return { orders, slots, lowStock, notifications, revenue: roundMoney(revenue) };
}

export function roleHome(role: Role) {
  if (role === Role.CASHIER) return "/cashier";
  if (role === Role.MANAGER || role === Role.ADMIN) return "/manager";
  return "/";
}
