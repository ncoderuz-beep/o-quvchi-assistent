import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Users, ClipboardList, TrendingUp, TrendingDown, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    students: 0,
    todayPresent: 0,
    todayAbsent: 0,
    totalRewards: 0,
    totalPenalties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [g, s, aPres, aAbs, sc] = await Promise.all([
        supabase.from("groups").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "present"),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "absent"),
        supabase.from("score_events").select("points"),
      ]);
      const points = sc.data ?? [];
      setStats({
        groups: g.count ?? 0,
        students: s.count ?? 0,
        todayPresent: aPres.count ?? 0,
        todayAbsent: aAbs.count ?? 0,
        totalRewards: points.filter((p: any) => p.points > 0).reduce((a: number, b: any) => a + b.points, 0),
        totalPenalties: points.filter((p: any) => p.points < 0).reduce((a: number, b: any) => a + b.points, 0),
      });
      setLoading(false);
    })();
  }, [user]);

  const cards = [
    { label: "Guruhlar", value: stats.groups, icon: Users, color: "text-primary", to: "/groups" as const },
    { label: "O‘quvchilar", value: stats.students, icon: Users, color: "text-info", to: "/groups" as const },
    { label: "Bugun keldi", value: stats.todayPresent, icon: ClipboardList, color: "text-success", to: "/attendance" as const },
    { label: "Bugun kelmadi", value: stats.todayAbsent, icon: ClipboardList, color: "text-destructive", to: "/attendance" as const },
    { label: "Jami mukofot", value: `+${stats.totalRewards}`, icon: TrendingUp, color: "text-success", to: "/scores" as const },
    { label: "Jami jarima", value: `${stats.totalPenalties}`, icon: TrendingDown, color: "text-destructive", to: "/scores" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold">Assalomu alaykum 👋</h1>
        <p className="mt-1 text-muted-foreground">Bugungi ko‘rsatkichlaringiz</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.label} to={c.to}>
                <Card className="p-5 transition hover:shadow-[var(--shadow-elegant)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{c.label}</div>
                      <div className={`mt-2 font-display text-3xl font-extrabold ${c.color}`}>{c.value}</div>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-accent ${c.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Tezkor amallar</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction to="/groups" icon={Users} title="Guruh qo‘shish" />
          <QuickAction to="/attendance" icon={ClipboardList} title="Davomatni belgilash" />
          <QuickAction to="/scores" icon={Trophy} title="Ball berish" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title }: { to: any; icon: any; title: string }) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-3 p-4 transition hover:bg-accent">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{title}</span>
      </Card>
    </Link>
  );
}
