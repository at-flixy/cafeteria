"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import type { DishDto, MenuItemDto } from "@/lib/client-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ManagerMenuDto = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  menuDate: string;
  items: MenuItemDto[];
} | null;

type ItemDraft = {
  dishId: string;
  price: string;
  availableQty: string;
};

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Данные недоступны");
  return response.json() as Promise<T>;
};

export default function ManagerMenuPage() {
  const { data: menu, mutate: mutateMenu } = useSWR("/api/manager/menu", (url) => fetcher<ManagerMenuDto>(url));
  const { data: dishes = [] } = useSWR("/api/manager/dishes", (url) => fetcher<DishDto[]>(url));
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [addDishId, setAddDishId] = useState<string | null>(null);
  const [addPrice, setAddPrice] = useState("");
  const [addQty, setAddQty] = useState("10");

  useEffect(() => {
    if (!menu?.items) return;
    setDrafts(Object.fromEntries(menu.items.map((item) => [item.id, {
      dishId: item.dish.id,
      price: String(item.price),
      availableQty: String(item.availableQty),
    }])));
  }, [menu?.items]);

  const usedDishIds = useMemo(() => new Set(menu?.items.map((item) => item.dish.id) ?? []), [menu?.items]);
  const availableDishes = dishes.filter((dish) => !usedDishIds.has(dish.id));

  const updateDraft = (id: string, patch: Partial<ItemDraft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  const saveItem = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    const response = await fetch(`/api/manager/menu/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishId: draft.dishId,
        price: Number(draft.price),
        availableQty: Number(draft.availableQty),
      }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось сохранить позицию");
      return;
    }
    toast.success("Позиция меню обновлена");
    await mutateMenu();
  };

  const addItem = async () => {
    if (!addDishId) {
      toast.error("Выберите блюдо");
      return;
    }
    const response = await fetch("/api/manager/menu/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishId: addDishId,
        price: addPrice ? Number(addPrice) : undefined,
        availableQty: Number(addQty),
      }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось добавить блюдо в меню");
      return;
    }
    toast.success("Блюдо добавлено в меню дня");
    setAddDishId(null);
    setAddPrice("");
    setAddQty("10");
    await mutateMenu();
  };

  const removeItem = async (id: string) => {
    const response = await fetch(`/api/manager/menu/items/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось удалить позицию меню");
      return;
    }
    toast.success("Позиция удалена из меню");
    await mutateMenu();
  };

  const stop = async (id: string, value: boolean) => {
    const response = await fetch(`/api/manager/menu/items/${id}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось изменить стоп-лист");
      return;
    }
    toast.success(value ? "Блюдо добавлено в стоп-лист" : "Блюдо возвращено в меню");
    await mutateMenu();
  };

  const setStatus = async (status: "DRAFT" | "PUBLISHED" | "CLOSED") => {
    const response = await fetch("/api/manager/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      toast.error("Не удалось изменить статус меню");
      return;
    }
    toast.success(status === "PUBLISHED" ? "Меню опубликовано" : "Статус меню обновлён");
    await mutateMenu();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Меню дня</h1>
          <p className="mt-2 text-muted-foreground">Добавляйте новые позиции, меняйте блюдо, цену, лимит порций и стоп-лист.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setStatus("DRAFT")}>Черновик</Button>
          <Button onClick={() => setStatus("PUBLISHED")}>Опубликовать</Button>
          <Button variant="secondary" onClick={() => setStatus("CLOSED")}>Закрыть</Button>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Статус меню
            <Badge>{menu?.status ?? "нет меню"}</Badge>
          </CardTitle>
          <CardDescription>Если меню на сегодня ещё не создано, добавление первой позиции создаст черновик автоматически.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_160px_140px_auto] lg:items-end">
          <div className="flex flex-col gap-2">
            <Label>Добавить блюдо</Label>
            <Select
              items={availableDishes.map((dish) => ({ label: dish.name, value: dish.id }))}
              value={addDishId}
              onValueChange={(value) => {
              if (!value) return;
              setAddDishId(value);
              const dish = dishes.find((candidate) => candidate.id === value);
              setAddPrice(dish ? String(dish.price) : "");
            }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Выберите блюдо" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableDishes.map((dish) => <SelectItem key={dish.id} value={dish.id}>{dish.name}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Цена, сом</Label>
            <Input type="number" min="1" step="0.01" value={addPrice} onChange={(event) => setAddPrice(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Порций</Label>
            <Input type="number" min="0" value={addQty} onChange={(event) => setAddQty(event.target.value)} />
          </div>
          <Button onClick={addItem} disabled={!addDishId}>
            <Plus data-icon="inline-start" />
            Добавить
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Позиции меню</CardTitle>
          <CardDescription>Удаление запрещено, если позиция уже попала в заказ или имеет резерв.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Блюдо</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Доступно</TableHead>
                <TableHead>Резерв</TableHead>
                <TableHead>Стоп-лист</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu?.items.map((item) => {
                const draft = drafts[item.id] ?? { dishId: item.dish.id, price: String(item.price), availableQty: String(item.availableQty) };
                return (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-64">
                      <Select
                        items={dishes.map((dish) => ({ label: dish.name, value: dish.id }))}
                        value={draft.dishId || undefined}
                        onValueChange={(value) => {
                        if (!value) return;
                        updateDraft(item.id, { dishId: value });
                      }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Блюдо" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {dishes.map((dish) => <SelectItem key={dish.id} value={dish.id}>{dish.name}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <div className="mt-1 text-xs text-muted-foreground">{item.dish.description}</div>
                    </TableCell>
                    <TableCell><Input type="number" min="1" step="0.01" value={draft.price} onChange={(event) => updateDraft(item.id, { price: event.target.value })} className="w-28" /></TableCell>
                    <TableCell><Input type="number" min={item.reservedQty} value={draft.availableQty} onChange={(event) => updateDraft(item.id, { availableQty: event.target.value })} className="w-28" /></TableCell>
                    <TableCell>{item.reservedQty}</TableCell>
                    <TableCell><Button variant={item.stopListFlag ? "destructive" : "outline"} size="sm" onClick={() => stop(item.id, !item.stopListFlag)}>{item.stopListFlag ? "Снять" : "Поставить"}</Button></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => saveItem(item.id)}><Save data-icon="inline-start" />Сохранить</Button>
                        <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}><Trash2 data-icon="inline-start" />Удалить</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!menu || menu.items.length === 0) && <TableRow><TableCell colSpan={6} className="text-muted-foreground">В меню пока нет позиций.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
