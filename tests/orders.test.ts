import { beforeEach, describe, expect, it } from "vitest";
import { Role, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cancelOrder, createOrder, issueOrder, markCashPaid, payOrder, searchCashierOrders, toggleStopList } from "@/lib/orders";
import { SlotFullError } from "@/lib/errors";

function futureDay() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function clean() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.dailyMenu.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.user.deleteMany();
  await prisma.reportSnapshot.deleteMany();
}

async function fixture(orderLimit = 10) {
  const [client, secondClient, cashier, manager] = await Promise.all([
    prisma.user.create({ data: { fullName: "Client One", email: "client-one@test", passwordHash: "x", role: Role.CLIENT } }),
    prisma.user.create({ data: { fullName: "Client Two", email: "client-two@test", passwordHash: "x", role: Role.CLIENT } }),
    prisma.user.create({ data: { fullName: "Cashier", email: "cashier@test", passwordHash: "x", role: Role.CASHIER } }),
    prisma.user.create({ data: { fullName: "Manager", email: "manager@test", passwordHash: "x", role: Role.MANAGER } }),
  ]);
  const date = futureDay();
  const [lagman, plov] = await Promise.all([
    prisma.dish.create({ data: { name: "Лагман", price: 160, calories: 500 } }),
    prisma.dish.create({ data: { name: "Плов", price: 180, calories: 650 } }),
  ]);
  const menu = await prisma.dailyMenu.create({ data: { menuDate: date, status: "PUBLISHED", publishedAt: new Date() } });
  const [lagmanItem, plovItem] = await Promise.all([
    prisma.menuItem.create({ data: { menuId: menu.id, dishId: lagman.id, price: 160, availableQty: 10 } }),
    prisma.menuItem.create({ data: { menuId: menu.id, dishId: plov.id, price: 180, availableQty: 10 } }),
  ]);
  const slot = await prisma.timeSlot.create({
    data: { slotDate: date, startTime: "23:00", endTime: "23:30", orderLimit },
  });
  return { client, secondClient, cashier, manager, lagmanItem, plovItem, slot };
}

beforeEach(async () => {
  await clean();
});

describe("order business flow", () => {
  it("creates an online order and marks it PAID with reservations", async () => {
    const data = await fixture();
    const order = await createOrder(data.client.id, data.slot.id, [
      { menuItemId: data.lagmanItem.id, quantity: 2 },
      { menuItemId: data.plovItem.id, quantity: 1 },
    ]);
    const paid = await payOrder(order.id, "ONLINE");

    expect(paid.status).toBe(OrderStatus.PAID);
    await expect(prisma.menuItem.findUniqueOrThrow({ where: { id: data.lagmanItem.id } })).resolves.toMatchObject({ reservedQty: 2 });
    await expect(prisma.menuItem.findUniqueOrThrow({ where: { id: data.plovItem.id } })).resolves.toMatchObject({ reservedQty: 1 });
    await expect(prisma.timeSlot.findUniqueOrThrow({ where: { id: data.slot.id } })).resolves.toMatchObject({ reservedCount: 1 });
  });

  it("creates a cash order, cashier accepts payment and issues it", async () => {
    const data = await fixture();
    const order = await createOrder(data.client.id, data.slot.id, [{ menuItemId: data.lagmanItem.id, quantity: 2 }]);
    const pending = await payOrder(order.id, "CASH");
    const found = await searchCashierOrders(order.orderNumber);
    const paid = await markCashPaid(order.id, data.cashier.id);
    const issued = await issueOrder(order.id, data.cashier.id);
    const item = await prisma.menuItem.findUniqueOrThrow({ where: { id: data.lagmanItem.id } });

    expect(pending.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(found[0]?.orderNumber).toBe(order.orderNumber);
    expect(paid.status).toBe(OrderStatus.PAID);
    expect(issued.status).toBe(OrderStatus.ISSUED);
    expect(item.availableQty).toBe(8);
  });

  it("cancels an unpaid order and rolls reservations back", async () => {
    const data = await fixture();
    const order = await createOrder(data.client.id, data.slot.id, [{ menuItemId: data.lagmanItem.id, quantity: 3 }]);
    const cancelled = await cancelOrder(order.id, data.client.id);
    const item = await prisma.menuItem.findUniqueOrThrow({ where: { id: data.lagmanItem.id } });
    const slot = await prisma.timeSlot.findUniqueOrThrow({ where: { id: data.slot.id } });

    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    expect(item.reservedQty).toBe(0);
    expect(slot.reservedCount).toBe(0);
  });

  it("notifies clients when manager puts ordered dish into stop-list", async () => {
    const data = await fixture();
    await createOrder(data.client.id, data.slot.id, [{ menuItemId: data.lagmanItem.id, quantity: 1 }]);
    await toggleStopList(data.lagmanItem.id, true, data.manager.id);
    const notification = await prisma.notification.findFirstOrThrow({ where: { userId: data.client.id, type: "STOP_LIST" } });
    expect(notification.message).toContain("Лагман");
  });

  it("rejects a second order when the slot limit is full", async () => {
    const data = await fixture(1);
    await createOrder(data.client.id, data.slot.id, [{ menuItemId: data.lagmanItem.id, quantity: 1 }]);
    await expect(createOrder(data.secondClient.id, data.slot.id, [{ menuItemId: data.plovItem.id, quantity: 1 }])).rejects.toBeInstanceOf(SlotFullError);
  });
});
