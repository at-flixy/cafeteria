import type { Role } from "@prisma/client";

export function roleLabel(role: Role | string | undefined) {
  const labels: Record<string, string> = {
    CLIENT: "Клиент",
    CASHIER: "Кассир",
    MANAGER: "Менеджер",
    ADMIN: "Админ",
  };
  return role ? labels[role] ?? role : "";
}
