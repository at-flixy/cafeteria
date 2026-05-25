import type { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/");
  return <>{children}</>;
}
