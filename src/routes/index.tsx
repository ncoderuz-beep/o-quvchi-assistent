import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, Sparkles, Award, ClipboardCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Ro‘yxatdan o‘tildi! Email pochtangizni tasdiqlang.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Xush kelibsiz!");
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast.error(err.message ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">Ustoz Yordamchi</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 lg:pt-16">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Ustozlar uchun zamonaviy yordamchi
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            O‘quvchilar davomati va ballarini{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              bir joyda
            </span>{" "}
            yuriting
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Guruhlar, davomat (keldi/kelmadi/kechikdi/sababli) va mukofot/jarima ballarini
            qulay tarzda boshqaring. Telefoningizdan ham, kompyuteringizdan ham.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Feature icon={<ClipboardCheck className="h-5 w-5" />} title="Davomat" desc="Bir bosishda belgilang" />
            <Feature icon={<Award className="h-5 w-5" />} title="Mukofot" desc="Faollarni rag‘batlantiring" />
            <Feature icon={<Sparkles className="h-5 w-5" />} title="Hisobot" desc="Umumiy ball ko‘rinadi" />
          </div>
        </div>

        <Card className="p-7 shadow-[var(--shadow-elegant)]">
          <div className="mb-6 flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">To‘liq ism</Label>
                <Input
                  id="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aliyev Vali"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ustoz@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Parol</Label>
              <Input
                id="pw"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Iltimos kuting..." : mode === "login" ? "Kirish" : "Ro‘yxatdan o‘tish"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 backdrop-blur">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
