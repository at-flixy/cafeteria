import type { Prisma } from "@prisma/client";

export async function auditLog(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  payload?: unknown,
) {
  return tx.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      payload: payload === undefined ? undefined : JSON.stringify(payload),
    },
  });
}
