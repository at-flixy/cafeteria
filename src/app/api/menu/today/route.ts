import { getTodayMenu } from "@/lib/orders";

export async function GET() {
  const data = await getTodayMenu();
  return Response.json(data);
}
