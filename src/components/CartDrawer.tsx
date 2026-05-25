"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/client-types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cartTotal } from "@/lib/cart-storage";
import { formatSom } from "@/lib/money";

export function CartDrawer({
  items,
  onChange,
}: {
  items: CartItem[];
  onChange: (items: CartItem[]) => void;
}) {
  const updateQuantity = (menuItemId: string, quantity: number) => {
    onChange(items.map((item) => item.menuItemId === menuItemId ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
  };

  return (
    <Sheet>
      <SheetTrigger render={<Button size="lg" className="shadow-sm" />}>
        <ShoppingCart data-icon="inline-start" />
        Корзина
        {items.length > 0 && <span className="rounded bg-white/20 px-1.5">{items.length}</span>}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Корзина</SheetTitle>
          <SheetDescription>Проверьте блюда перед оформлением заказа.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Корзина пока пуста</div>
          ) : items.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{formatSom(item.price)} за порцию</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
                  {item.quantity === 1 ? <Trash2 data-icon="inline-start" /> : <Minus data-icon="inline-start" />}
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button size="icon-sm" variant="ghost" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
                  <Plus data-icon="inline-start" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <SheetFooter>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Итого</span>
            <span>{formatSom(cartTotal(items))}</span>
          </div>
          <Link href="/checkout" className="no-underline">
            <Button className="w-full" disabled={items.length === 0}>Оформить</Button>
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
