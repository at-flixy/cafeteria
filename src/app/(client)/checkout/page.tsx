"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SlotPicker } from "@/components/SlotPicker";
import type { CartItem, TodayMenuDto } from "@/lib/client-types";
import { cartTotal, clearCart, getCartItems } from "@/lib/cart-storage";
import { formatSom } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Не удалось загрузить слоты");
  return response.json() as Promise<TodayMenuDto>;
};

type CheckoutMethod = "ONLINE" | "CASH";

export default function CheckoutPage() {
  const router = useRouter();
  const { data } = useSWR("/api/menu/today", fetcher);
  const [items, setItems] = useState<CartItem[]>([]);
  const [slotId, setSlotId] = useState("");
  const [method, setMethod] = useState<CheckoutMethod>("ONLINE");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => setItems(getCartItems()), []);

  const submit = async () => {
    if (!slotId) {
      toast.error("Выберите слот получения");
      return;
    }
    setProcessing(true);
    const createResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId,
        items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      }),
    });
    if (!createResponse.ok) {
      const payload = await createResponse.json() as { error?: string };
      setProcessing(false);
      toast.error(payload.error ?? "Не удалось создать заказ");
      return;
    }
    const order = await createResponse.json() as { id: string };
    const payResponse = await fetch(`/api/orders/${order.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    setProcessing(false);
    if (!payResponse.ok) {
      const payload = await payResponse.json() as { error?: string };
      toast.error(payload.error ?? "Не удалось оплатить заказ");
      return;
    }
    clearCart();
    if (method === "ONLINE") {
      setSuccess(true);
      setTimeout(() => router.push("/orders"), 900);
    } else {
      toast.success("Заказ создан. Оплатите на кассе при получении.");
      router.push("/orders");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold">Оформление заказа</h1>
          <p className="mt-2 text-muted-foreground">Выберите окно выдачи и способ оплаты.</p>
        </div>
        <Card className="rounded-lg">
          <CardHeader><CardTitle>Слот получения</CardTitle></CardHeader>
          <CardContent>
            <SlotPicker slots={data?.slots ?? []} value={slotId} onChange={setSlotId} />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader><CardTitle>Оплата</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMethod("ONLINE")} className={`rounded-lg border bg-card p-4 text-left ${method === "ONLINE" ? "border-primary ring-2 ring-primary/25" : ""}`}>
              <div className="font-medium">Онлайн</div>
              <div className="text-sm text-muted-foreground">Mock-платёж с задержкой 2 сек.</div>
            </button>
            <button type="button" onClick={() => setMethod("CASH")} className={`rounded-lg border bg-card p-4 text-left ${method === "CASH" ? "border-primary ring-2 ring-primary/25" : ""}`}>
              <div className="font-medium">На кассе</div>
              <div className="text-sm text-muted-foreground">Оплата при получении.</div>
            </button>
          </CardContent>
        </Card>
      </section>
      <Card className="h-fit rounded-lg">
        <CardHeader><CardTitle>Ваш заказ</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between gap-3 text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatSom(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-3 text-lg font-semibold">
            <span>Итого</span>
            <span>{formatSom(cartTotal(items))}</span>
          </div>
          <Button onClick={submit} disabled={processing || items.length === 0}>
            {processing && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Подтвердить
          </Button>
        </CardContent>
      </Card>
      <Dialog open={processing || success}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{success ? "Оплата прошла ✓" : method === "ONLINE" ? "Обработка платежа..." : "Создаём заказ..."}</DialogTitle>
            <DialogDescription>{success ? "Перенаправляем в мои заказы." : "Пожалуйста, дождитесь завершения операции."}</DialogDescription>
          </DialogHeader>
          {!success && <Loader2 className="mx-auto size-10 animate-spin text-primary" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
