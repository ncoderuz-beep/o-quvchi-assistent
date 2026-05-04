import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Trophy,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface TopStudent {
  id: string;
  name: string;
  points: number;
  groupName?: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    students: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    todayExcused: 0,
    totalRewards: 0,
    totalPenalties: 0,
  });
  const [weekly, setWeekly] = useState<{ day: string; keldi: number; kelmadi: number }[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);

      const [g, s, aPres, aAbs, aLate, aExc, sc, weekAtt, studentsAll, groupsAll] =
        await Promise.all([
          supabase.from("groups").select("id", { count: "exact", head: true }),
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("date", todayStr)
            .eq("status", "present"),
          supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("date", todayStr)
            .eq("status", "absent"),
          supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("date", todayStr)
            .eq("status", "late"),
          supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("date", todayStr)
            .eq("status", "excused"),
          supabase.from("score_events").select("points, student_id"),
          supabase
            .from("attendance")
            .select("date, status")
            .gte("date", weekAgoStr)
            .lte("date", todayStr),
          supabase.from("students").select("id, full_name, group_id"),
          supabase.from("groups").select("id, name"),
        ]);

      const points = sc.data ?? [];
      const totals: Record<string, number> = {};
      points.forEach((p: any) => {
        totals[p.student_id] = (totals[p.student_id] ?? 0) + p.points;
      });

      const groupMap = new Map((groupsAll.data ?? []).map((g: any) => [g.id, g.name]));
      const top = (studentsAll.data ?? [])
        .map((st: any) => ({
          id: st.id,
          name: st.full_name,
          points: totals[st.id] ?? 0,
          groupName: groupMap.get(st.group_id) as string | undefined,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

      // Weekly chart data
      const days = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
      const map: Record<string, { keldi: number; kelmadi: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        map[d.toISOString().slice(0, 10)] = { keldi: 0, kelmadi: 0 };
      }
      (weekAtt.data ?? []).forEach((a: any) => {
        if (!map[a.date]) return;
        if (a.status === "present" || a.status === "late") map[a.date].keldi++;
        else if (a.status === "absent") map[a.date].kelmadi++;
      });
      const weeklyArr = Object.entries(map).map(([date, v]) => {
        const d = new Date(date);
        return { day: days[d.getDay()], keldi: v.keldi, kelmadi: v.kelmadi };
      });

      setStats({
        groups: g.count ?? 0,
        students: s.count ?? 0,
        todayPresent: aPres.count ?? 0,
        todayAbsent: aAbs.count ?? 0,
        todayLate: aLate.count ?? 0,
        todayExcused: aExc.count ?? 0,
        totalRewards: points
          .filter((p: any) => p.points > 0)
          .reduce((a: number, b: any) => a + b.points, 0),
        totalPenalties: points
          .filter((p: any) => p.points < 0)
          .reduce((a: number, b: any) => a + b.points, 0),
      });
      setWeekly(weeklyArr);
      setTopStudents(top);
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

  const todayPie = [
    { name: "Keldi", value: stats.todayPresent, color: "oklch(0.72 0.17 155)" },
    { name: "Kelmadi", value: stats.todayAbsent, color: "oklch(0.65 0.22 27)" },
    { name: "Kechikdi", value: stats.todayLate, color: "oklch(0.78 0.16 75)" },
    { name: "Sababli", value: stats.todayExcused, color: "oklch(0.7 0.14 240)" },
  ];
  const hasTodayData = todayPie.some((p) => p.value > 0);

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
        <>
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

          {/* Charts row */}
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">Haftalik davomat</h2>
                  <p className="text-xs text-muted-foreground">So‘nggi 7 kun</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="oklch(0.55 0.02 250)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="oklch(0.55 0.02 250)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="keldi" name="Keldi" fill="oklch(0.72 0.17 155)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="kelmadi" name="Kelmadi" fill="oklch(0.65 0.22 27)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4">
                <h2 className="font-display text-lg font-bold">Bugungi davomat</h2>
                <p className="text-xs text-muted-foreground">Holatlar bo‘yicha</p>
              </div>
              <div className="h-64 w-full">
                {hasTodayData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={todayPie.filter((p) => p.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {todayPie
                          .filter((p) => p.value > 0)
                          .map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Bugun davomat belgilanmagan
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Top active students */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Eng faol o‘quvchilar</h2>
                <p className="text-sm text-muted-foreground">Ballar bo‘yicha top 5</p>
              </div>
              <Link to="/scores" className="text-sm font-medium text-primary hover:underline">
                Hammasi
              </Link>
            </div>
            <Card className="divide-y">
              {topStudents.length === 0 || topStudents.every((s) => s.points === 0) ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Hali ball berilmagan. <Link to="/scores" className="text-primary hover:underline">Ball berish</Link>
                </div>
              ) : (
                topStudents.map((s, i) => {
                  const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : Trophy;
                  const rankColor =
                    i === 0
                      ? "text-warning"
                      : i === 1
                      ? "text-muted-foreground"
                      : i === 2
                      ? "text-info"
                      : "text-muted-foreground";
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold ${rankColor}`}>
                        <RankIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{s.name}</div>
                        {s.groupName && (
                          <div className="text-xs text-muted-foreground">{s.groupName}</div>
                        )}
                      </div>
                      <Badge
                        variant={s.points > 0 ? "default" : s.points < 0 ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        <Trophy className="h-3 w-3" />
                        {s.points > 0 ? `+${s.points}` : s.points}
                      </Badge>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          <div className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold">Tezkor amallar</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAction to="/groups" icon={Users} title="Guruh qo‘shish" />
              <QuickAction to="/attendance" icon={ClipboardList} title="Davomatni belgilash" />
              <QuickAction to="/scores" icon={Trophy} title="Ball berish" />
            </div>
          </div>
        </>
      )}
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
