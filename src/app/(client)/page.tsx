"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ChefHat, Clock, ShoppingCart } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { DishCard } from "@/components/DishCard";
import type { CartItem, TodayMenuDto } from "@/lib/client-types";
import { getCartItems, setCartItems } from "@/lib/cart-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Не удалось загрузить меню");
  return response.json() as Promise<TodayMenuDto>;
};

export default function ClientMenuPage() {
  const { data, isLoading } = useSWR("/api/menu/today", fetcher);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => setCart(getCartItems()), []);

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    setCartItems(items);
  };

  const addToCart = (next: CartItem) => {
    const existing = cart.find((item) => item.menuItemId === next.menuItemId);
    const updated = existing
      ? cart.map((item) => item.menuItemId === next.menuItemId ? { ...item, quantity: item.quantity + next.quantity } : item)
      : [...cart, next];
    saveCart(updated);
    toast.success(`${next.name} добавлено в корзину`);
  };

  const availableCount = useMemo(() => data?.menu?.items.filter((item) => !item.stopListFlag).length ?? 0, [data]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Меню дня</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Выберите блюда, время получения и способ оплаты. Все данные демонстрационные и работают локально.
          </p>
        </div>
        <CartDrawer items={cart} onChange={saveCart} />
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardContent className="flex items-center gap-3 py-4">
            <ChefHat className="size-5 text-primary" />
            <div><div className="font-semibold">{availableCount}</div><div className="text-sm text-muted-foreground">позиций доступно</div></div>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="size-5 text-primary" />
            <div><div className="font-semibold">{data?.slots.length ?? 0}</div><div className="text-sm text-muted-foreground">тайм-слотов</div></div>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center gap-3 py-4">
            <ShoppingCart className="size-5 text-primary" />
            <div><div className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div><div className="text-sm text-muted-foreground">порций в корзине</div></div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <div className="rounded-lg border bg-card p-6 text-muted-foreground">Загружаем меню...</div>}
      {!isLoading && !data?.menu && <div className="rounded-lg border bg-card p-6">Сегодняшнее меню ещё не опубликовано.</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.menu?.items.map((item) => (
          <div key={item.id} className="relative">
            {item.stopListFlag && <Badge className="absolute right-3 top-3 z-10 bg-red-600 text-white">Стоп-лист</Badge>}
            <DishCard item={item} onAdd={addToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}
