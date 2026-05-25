"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import type { DishDto } from "@/lib/client-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatSom } from "@/lib/money";

type DishFormState = {
  id: string | null;
  name: string;
  description: string;
  price: string;
  calories: string;
  proteins_g: string;
  fats_g: string;
  carbs_g: string;
  allergens: string;
  photoUrl: string;
};

const emptyDish: DishFormState = {
  id: null,
  name: "",
  description: "",
  price: "100",
  calories: "0",
  proteins_g: "0",
  fats_g: "0",
  carbs_g: "0",
  allergens: "",
  photoUrl: "",
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Блюда недоступны");
  return response.json() as Promise<DishDto[]>;
};

function fromDish(dish: DishDto): DishFormState {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description ?? "",
    price: String(dish.price),
    calories: String(dish.calories),
    proteins_g: String(dish.proteins_g),
    fats_g: String(dish.fats_g),
    carbs_g: String(dish.carbs_g),
    allergens: dish.allergens ?? "",
    photoUrl: dish.photoUrl ?? "",
  };
}

function toPayload(form: DishFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    calories: Number(form.calories),
    proteins_g: Number(form.proteins_g),
    fats_g: Number(form.fats_g),
    carbs_g: Number(form.carbs_g),
    allergens: form.allergens.trim() || null,
    photoUrl: form.photoUrl.trim() || null,
  };
}

export default function ManagerDishesPage() {
  const { data = [], mutate } = useSWR("/api/manager/dishes", fetcher);
  const [form, setForm] = useState<DishFormState>(emptyDish);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data;
    return data.filter((dish) => `${dish.name} ${dish.description ?? ""} ${dish.allergens ?? ""}`.toLowerCase().includes(normalized));
  }, [data, query]);

  const updateForm = (patch: Partial<DishFormState>) => setForm((current) => ({ ...current, ...patch }));

  const uploadImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const payload = new FormData();
    payload.append("file", file);
    const response = await fetch("/api/manager/uploads/dish-image", { method: "POST", body: payload });
    setUploading(false);
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      toast.error(result.error ?? "Не удалось загрузить изображение");
      return;
    }
    updateForm({ photoUrl: result.url });
    toast.success("Изображение загружено");
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Введите название блюда");
      return;
    }
    setSaving(true);
    const response = await fetch(form.id ? `/api/manager/dishes/${form.id}` : "/api/manager/dishes", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    setSaving(false);
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось сохранить блюдо");
      return;
    }
    toast.success(form.id ? "Блюдо обновлено" : "Блюдо создано");
    setForm(emptyDish);
    await mutate();
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/manager/dishes/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось удалить блюдо");
      return;
    }
    if (form.id === id) setForm(emptyDish);
    toast.success("Блюдо удалено");
    await mutate();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card className="h-fit rounded-lg">
        <CardHeader>
          <CardTitle>{form.id ? "Редактирование блюда" : "Новое блюдо"}</CardTitle>
          <CardDescription>Меняйте все поля карточки, включая КБЖУ, аллергены и фото.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border bg-secondary">
            {form.photoUrl ? (
              <Image src={form.photoUrl} alt={form.name || "Фото блюда"} fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Фото не выбрано</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo">Загрузить картинку</Label>
            <Input id="photo" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => uploadImage(event.target.files?.[0] ?? null)} />
            <Input value={form.photoUrl} onChange={(event) => updateForm({ photoUrl: event.target.value })} placeholder="/dishes/uploads/example.webp" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Название</Label>
            <Input id="name" value={form.name} onChange={(event) => updateForm({ name: event.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" value={form.description} onChange={(event) => updateForm({ description: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2"><Label>Цена, сом</Label><Input type="number" min="1" step="0.01" value={form.price} onChange={(event) => updateForm({ price: event.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Ккал</Label><Input type="number" min="0" value={form.calories} onChange={(event) => updateForm({ calories: event.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Белки, г</Label><Input type="number" min="0" step="0.01" value={form.proteins_g} onChange={(event) => updateForm({ proteins_g: event.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Жиры, г</Label><Input type="number" min="0" step="0.01" value={form.fats_g} onChange={(event) => updateForm({ fats_g: event.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Углеводы, г</Label><Input type="number" min="0" step="0.01" value={form.carbs_g} onChange={(event) => updateForm({ carbs_g: event.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label>Аллергены</Label><Input value={form.allergens} onChange={(event) => updateForm({ allergens: event.target.value })} placeholder="молоко, глютен" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || uploading}>
              <Save data-icon="inline-start" />
              {saving ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={() => setForm(emptyDish)}>
              <Plus data-icon="inline-start" />
              Новое
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Справочник блюд</CardTitle>
          <CardDescription>Выберите строку для редактирования или удалите блюдо без заказов.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию, описанию или аллергенам" />
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Блюдо</TableHead>
                  <TableHead>КБЖУ</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Меню</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-14 overflow-hidden rounded-md bg-secondary">
                          {dish.photoUrl ? <Image src={dish.photoUrl} alt={dish.name} fill unoptimized className="object-cover" /> : <ImagePlus className="m-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium">{dish.name}</div>
                          <div className="line-clamp-2 text-xs text-muted-foreground">{dish.description}</div>
                          {dish.allergens && <Badge variant="outline" className="mt-1">{dish.allergens}</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dish.calories} ккал · Б {dish.proteins_g} · Ж {dish.fats_g} · У {dish.carbs_g}</TableCell>
                    <TableCell>{formatSom(dish.price)}</TableCell>
                    <TableCell>{dish._count?.menuItems ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setForm(fromDish(dish))}>Редактировать</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(dish.id)}>
                          <Trash2 data-icon="inline-start" />
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-muted-foreground">Блюда не найдены.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
