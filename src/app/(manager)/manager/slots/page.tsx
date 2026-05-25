"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { CalendarDays, Clock, Plus, Save, Trash2 } from "lucide-react";
import type { TimeSlotDto } from "@/lib/client-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SlotDraft = {
  slotDate: string;
  startTime: string;
  endTime: string;
  orderLimit: string;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Слоты недоступны");
  return response.json() as Promise<TimeSlotDto[]>;
};

function toDateInput(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromSlot(slot: TimeSlotDto): SlotDraft {
  return {
    slotDate: toDateInput(slot.slotDate),
    startTime: slot.startTime,
    endTime: slot.endTime,
    orderLimit: String(slot.orderLimit),
  };
}

function payloadFromDraft(draft: SlotDraft) {
  return {
    slotDate: draft.slotDate,
    startTime: draft.startTime,
    endTime: draft.endTime,
    orderLimit: Number(draft.orderLimit),
  };
}

const defaultStart = "12:00";
const defaultEnd = "12:30";
const emptySlots: TimeSlotDto[] = [];

export default function ManagerSlotsPage() {
  const today = toDateInput(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [createDraft, setCreateDraft] = useState<SlotDraft>({
    slotDate: today,
    startTime: defaultStart,
    endTime: defaultEnd,
    orderLimit: "10",
  });
  const [drafts, setDrafts] = useState<Record<string, SlotDraft>>({});
  const { data, mutate, isLoading } = useSWR(`/api/manager/slots?date=${selectedDate}`, fetcher);
  const slots = data ?? emptySlots;

  useEffect(() => {
    setCreateDraft((current) => ({ ...current, slotDate: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    if (!data) return;
    setDrafts(Object.fromEntries(data.map((slot) => [slot.id, fromSlot(slot)])));
  }, [data]);

  const updateDraft = (id: string, patch: Partial<SlotDraft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  const createSlot = async () => {
    const response = await fetch("/api/manager/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFromDraft(createDraft)),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось создать слот");
      return;
    }
    toast.success("Слот создан");
    setCreateDraft({ slotDate: selectedDate, startTime: defaultStart, endTime: defaultEnd, orderLimit: "10" });
    await mutate();
  };

  const saveSlot = async (slot: TimeSlotDto) => {
    const draft = drafts[slot.id];
    if (!draft) return;
    const response = await fetch(`/api/manager/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFromDraft(draft)),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Слот не обновлён");
      return;
    }
    toast.success("Слот обновлён");
    if (draft.slotDate !== selectedDate) setSelectedDate(draft.slotDate);
    await mutate();
  };

  const deleteSlot = async (id: string) => {
    const response = await fetch(`/api/manager/slots/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      toast.error(result.error ?? "Не удалось удалить слот");
      return;
    }
    toast.success("Слот удалён");
    await mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Тайм-слоты</h1>
          <p className="mt-2 text-muted-foreground">Создавайте, переносите и удаляйте окна выдачи. Лимит нельзя поставить ниже уже занятых мест.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <Label htmlFor="slot-date-filter">Дата расписания</Label>
          <Input
            id="slot-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="sm:w-48"
          />
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="size-5" /> Новый слот</CardTitle>
          <CardDescription>Добавьте окно выдачи на выбранную дату или на любую другую дату расписания.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5 md:items-end">
          <div className="flex flex-col gap-2">
            <Label>Дата</Label>
            <Input type="date" value={createDraft.slotDate} onChange={(event) => setCreateDraft((current) => ({ ...current, slotDate: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Начало</Label>
            <Input type="time" value={createDraft.startTime} onChange={(event) => setCreateDraft((current) => ({ ...current, startTime: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Конец</Label>
            <Input type="time" value={createDraft.endTime} onChange={(event) => setCreateDraft((current) => ({ ...current, endTime: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Лимит заказов</Label>
            <Input type="number" min="1" value={createDraft.orderLimit} onChange={(event) => setCreateDraft((current) => ({ ...current, orderLimit: event.target.value }))} />
          </div>
          <Button onClick={createSlot}>
            <Plus data-icon="inline-start" />
            Добавить
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot) => {
          const draft = drafts[slot.id] ?? fromSlot(slot);
          const free = Math.max(0, slot.orderLimit - slot.reservedCount);
          return (
            <Card key={slot.id} className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Clock className="size-5" /> {slot.startTime}-{slot.endTime}</span>
                  <Badge variant={free > 0 ? "outline" : "destructive"}>{free} свободно</Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  Занято {slot.reservedCount} из {slot.orderLimit}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Дата</Label>
                    <Input type="date" value={draft.slotDate} onChange={(event) => updateDraft(slot.id, { slotDate: event.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Лимит</Label>
                    <Input
                      type="number"
                      min={slot.reservedCount}
                      value={draft.orderLimit}
                      onChange={(event) => updateDraft(slot.id, { orderLimit: event.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Начало</Label>
                    <Input type="time" value={draft.startTime} onChange={(event) => updateDraft(slot.id, { startTime: event.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Конец</Label>
                    <Input type="time" value={draft.endTime} onChange={(event) => updateDraft(slot.id, { endTime: event.target.value })} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={() => saveSlot(slot)}>
                    <Save data-icon="inline-start" />
                    Сохранить
                  </Button>
                  <Button variant="destructive" onClick={() => deleteSlot(slot.id)}>
                    <Trash2 data-icon="inline-start" />
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && slots.length === 0 && (
        <Card className="rounded-lg">
          <CardContent className="py-8 text-muted-foreground">На выбранную дату слотов пока нет.</CardContent>
        </Card>
      )}
    </div>
  );
}
