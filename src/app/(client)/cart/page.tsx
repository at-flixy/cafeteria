"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/client-types";
import { cartTotal, getCartItems, setCartItems } from "@/lib/cart-storage";
import { formatSom } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => setItems(getCartItems()), []);

  const save = (next: CartItem[]) => {
    setItems(next);
    setCartItems(next);
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    save(items.map((item) => item.menuItemId === menuItemId ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Корзина</h1>
        {items.length === 0 ? (
          <Card><CardContent className="py-8 text-muted-foreground">Корзина пуста. Вернитесь в меню и добавьте блюда.</CardContent></Card>
        ) : items.map((item) => (
          <Card key={item.menuItemId} className="rounded-lg">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{formatSom(item.price)} за порцию</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon-sm" variant="outline" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
                  {item.quantity === 1 ? <Trash2 data-icon="inline-start" /> : <Minus data-icon="inline-start" />}
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button size="icon-sm" variant="outline" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
                  <Plus data-icon="inline-start" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="h-fit rounded-lg">
        <CardHeader><CardTitle>Итого</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Сумма</span>
            <span>{formatSom(cartTotal(items))}</span>
          </div>
          <Link href="/checkout" className="no-underline"><Button className="w-full" disabled={items.length === 0}>Оформить</Button></Link>
          <Link href="/" className="text-center text-sm text-primary no-underline">Вернуться в меню</Link>
        </CardContent>
      </Card>
    </div>
  );
}
