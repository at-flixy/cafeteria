"use client";

import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { CartItem, MenuItemDto } from "@/lib/client-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSom } from "@/lib/money";

export function DishCard({ item, onAdd }: { item: MenuItemDto; onAdd: (item: CartItem) => void }) {
  const available = Math.max(0, item.availableQty - item.reservedQty);
  const [quantity, setQuantity] = useState(1);
  const disabled = available <= 0 || item.stopListFlag;

  return (
    <Card className="rounded-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <Image src={item.dish.photoUrl ?? "/dishes/fallback.svg"} alt={item.dish.name} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{item.dish.name}</CardTitle>
          <Badge className="bg-primary text-primary-foreground">{formatSom(item.price)}</Badge>
        </div>
        <p className="min-h-10 text-sm text-muted-foreground">{item.dish.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <span className="rounded-md bg-secondary px-2 py-1">{item.dish.calories} ккал</span>
          <span className="rounded-md bg-secondary px-2 py-1">Б {item.dish.proteins_g}</span>
          <span className="rounded-md bg-secondary px-2 py-1">Ж {item.dish.fats_g}</span>
          <span className="rounded-md bg-secondary px-2 py-1">У {item.dish.carbs_g}</span>
        </div>
        <div className="flex min-h-6 flex-wrap gap-2">
          {item.dish.allergens ? item.dish.allergens.split(",").map((allergen) => (
            <Badge key={allergen.trim()} variant="outline">{allergen.trim()}</Badge>
          )) : <Badge variant="secondary">без аллергенов</Badge>}
        </div>
        <div className="text-sm text-muted-foreground">
          Доступно порций: <span className="font-medium text-foreground">{available}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <div className="flex items-center rounded-lg border bg-background">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
            <Minus data-icon="inline-start" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQuantity(Math.min(available, quantity + 1))} disabled={quantity >= available}>
            <Plus data-icon="inline-start" />
          </Button>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => onAdd({
            menuItemId: item.id,
            dishId: item.dish.id,
            name: item.dish.name,
            price: item.price,
            photoUrl: item.dish.photoUrl,
            availableQty: item.availableQty,
            reservedQty: item.reservedQty,
            quantity,
          })}
        >
          <ShoppingCart data-icon="inline-start" />
          В корзину
        </Button>
      </CardFooter>
    </Card>
  );
}
