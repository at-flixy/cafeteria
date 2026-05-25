import { PaymentStatus } from "@prisma/client";

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockOnlinePayment(orderId: string) {
  await sleep(process.env.NODE_ENV === "test" ? 1 : 2000);
  return {
    method: "ONLINE" as const,
    status: PaymentStatus.SUCCESS,
    providerRef: `mock-${orderId}-${Date.now()}`,
    paidAt: new Date(),
  };
}
