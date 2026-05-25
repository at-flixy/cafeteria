"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().min(3, "Введите email").includes("@", { message: "Введите email" }),
  password: z.string().min(1, "Введите пароль"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: { email: "client@demo", password: "demo" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error("Заполните email и пароль");
      return;
    }
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) {
      toast.error("Неверный email или пароль");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ?? "/");
    router.refresh();
  });

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
      <Card className="w-full rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Вход</CardTitle>
          <CardDescription>Используйте demo-аккаунт или зарегистрируйте клиента.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Входим..." : "Войти"}
            </Button>
            <div className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              <div>client@demo / demo</div>
              <div>cashier@demo / demo</div>
              <div>manager@demo / demo</div>
            </div>
            <Link href="/register" className="text-center text-sm text-primary no-underline hover:underline">Создать клиентский аккаунт</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
