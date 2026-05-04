import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  Sparkles,
  Award,
  ClipboardCheck,
  ArrowRight,
  Users,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Clock,
  TrendingUp,
  CheckCircle2,
  Zap,
  Trophy,
  CalendarCheck,
  UserPlus,
  MousePointerClick,
  LineChart,
} from "lucide-react";
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

      <main className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
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
            Daftar va Excel jadvallariga ortiq ehtiyoj yo‘q.{" "}
            <strong className="text-foreground">Ustoz Yordamchi</strong> — guruhlar, davomat va
            mukofot/jarima ballarini bir necha soniyada boshqarishga yordam beradigan zamonaviy ilova.
            Telefon ham, kompyuter ham — barcha qurilmada ishlaydi.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              "4 turdagi davomat: Keldi / Kelmadi / Kechikdi / Sababli",
              "Mukofot (+) va jarima (−) ballari, sabablari bilan",
              "Har bir o‘quvchining umumiy bali avtomatik hisoblanadi",
              "Cheksiz guruh va o‘quvchi qo‘shish imkoniyati",
              "Ma'lumotlar bulutda xavfsiz saqlanadi",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat value="4" label="Davomat turi" />
            <Stat value="∞" label="Guruh va o‘quvchi" />
            <Stat value="100%" label="Bepul" />
          </div>
        </div>

        <Card className="h-fit p-7 shadow-[var(--shadow-elegant)] lg:sticky lg:top-8">
          <div className="mb-5 text-center">
            <h2 className="font-display text-xl font-bold">Hisobingizga kiring</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bir daqiqada boshlang</p>
          </div>
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
            <p className="text-center text-xs text-muted-foreground">
              Ro‘yxatdan o‘tish bepul. Bir necha soniyada tayyor.
            </p>
          </form>
        </Card>
      </main>

      {/* Imkoniyatlar */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Imkoniyatlar
          </div>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            Ustozlar uchun mo‘ljallangan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Har kungi vazifalaringizni soddalashtiradigan barcha kerakli vositalar
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <BigFeature
            icon={<Users className="h-5 w-5" />}
            title="Guruhlarni boshqarish"
            desc="Cheksiz guruh yarating, har biriga o‘quvchilarni qo‘shing va alohida nazorat qiling."
          />
          <BigFeature
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Tezkor davomat"
            desc="Bir bosish bilan: Keldi, Kelmadi, Kechikdi yoki Sababli — har bir o‘quvchini belgilang."
          />
          <BigFeature
            icon={<Award className="h-5 w-5" />}
            title="Mukofot va jarima"
            desc="Faollarga (+) ball bering, vazifa bajarmaganlarga (−) ayiring. Har bir amal sababi bilan saqlanadi."
          />
          <BigFeature
            icon={<BarChart3 className="h-5 w-5" />}
            title="Reyting va hisobot"
            desc="Umumiy ballar avtomatik hisoblanadi. Eng faol o‘quvchilar reytingda ko‘rinadi."
          />
          <BigFeature
            icon={<Smartphone className="h-5 w-5" />}
            title="Mobil va kompyuter"
            desc="Telefon, planshet yoki noutbukdan — istalgan qurilmadan ma'lumotlaringizga kiring."
          />
          <BigFeature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Xavfsiz saqlash"
            desc="Ma'lumotlaringiz bulutda himoyalangan tarzda saqlanadi. Faqat siz ko‘rishingiz mumkin."
          />
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section className="border-y bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              Qanday ishlaydi
            </div>
            <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
              3 oddiy qadamda boshlang
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Step
              num="1"
              icon={<UserPlus className="h-5 w-5" />}
              title="Guruh va o‘quvchilarni qo‘shing"
              desc="Sinflaringizni yarating va har bir guruhga o‘quvchilar ro‘yxatini kiriting."
            />
            <Step
              num="2"
              icon={<MousePointerClick className="h-5 w-5" />}
              title="Davomat va ballarni belgilang"
              desc="Har dars davomida bir bosish bilan davomatni va kerak bo‘lsa ballarni qo‘shing."
            />
            <Step
              num="3"
              icon={<LineChart className="h-5 w-5" />}
              title="Natijalarni kuzating"
              desc="Reytinglar, statistika va har bir o‘quvchining tarixi — barchasi bir joyda."
            />
          </div>
        </div>
      </section>

      {/* Kim uchun */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              Kim uchun
            </div>
            <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
              Har qanday ustoz uchun mos
            </h2>
            <p className="mt-3 text-muted-foreground">
              Maktab o‘qituvchilari, repetitorlar, o‘quv markazlari va trenerlar — barcha
              ta'lim sohasi vakillari uchun yagona, qulay platforma.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: <GraduationCap className="h-4 w-4" />, text: "Maktab ustozlari" },
                { icon: <Trophy className="h-4 w-4" />, text: "O‘quv markazlari" },
                { icon: <Users className="h-4 w-4" />, text: "Repetitorlar" },
                { icon: <Zap className="h-4 w-4" />, text: "Sport va san'at trenerlari" },
              ].map((i) => (
                <div key={i.text} className="flex items-center gap-2 rounded-lg border bg-card/60 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    {i.icon}
                  </span>
                  <span className="text-sm font-medium">{i.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MiniCard icon={<Clock className="h-5 w-5" />} title="Vaqtni tejaydi" desc="Daftarga yozishdan 10x tezroq" />
            <MiniCard icon={<TrendingUp className="h-5 w-5" />} title="Motivatsiya" desc="Ballar tizimi rag‘batlantiradi" />
            <MiniCard icon={<CalendarCheck className="h-5 w-5" />} title="Tarix saqlanadi" desc="Har bir kun doim qo‘l ostida" />
            <MiniCard icon={<ShieldCheck className="h-5 w-5" />} title="Xususiy" desc="Faqat siz o‘z guruhlaringizni ko‘rasiz" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Card
          className="overflow-hidden p-10 text-center text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">
            Bugundan boshlab darslaringizni osonlashtirir
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Bepul ro‘yxatdan o‘ting va birinchi guruhingizni 1 daqiqada yarating.
          </p>
          <Button
            onClick={() => {
              setMode("signup");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            size="lg"
            variant="secondary"
            className="mt-6"
          >
            Hoziroq boshlash <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span>© {new Date().getFullYear()} Ustoz Yordamchi</span>
          </div>
          <span>Ustozlar uchun mehr bilan yaratildi</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-3 text-center backdrop-blur">
      <div
        className="font-display text-2xl font-extrabold bg-clip-text text-transparent"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function BigFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="group p-6 transition hover:shadow-[var(--shadow-elegant)]">
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground transition group-hover:scale-110"
        style={{ background: "var(--gradient-primary)" }}
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}

function Step({
  num,
  icon,
  title,
  desc,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-2xl border bg-card p-6">
      <div className="absolute -top-3 left-6 rounded-full bg-background px-2 text-xs font-bold text-muted-foreground">
        QADAM {num}
      </div>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function MiniCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
