import type { Prisma } from "@prisma/client";

export async function notifyUser(tx: Prisma.TransactionClient, userId: string, message: string, type = "SYSTEM") {
  return tx.notification.create({ data: { userId, message, type } });
}
