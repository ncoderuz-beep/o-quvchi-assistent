import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trophy, TrendingUp, TrendingDown, Trash2, Search, Download,
  Crown, Medal, Award, Sparkles, Target, Flame, Star, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

export const Route = createFileRoute("/_app/scores")({
  component: ScoresPage,
});

const QUICK_POSITIVE = [
  { points: 5, label: "Faollik", icon: Sparkles },
  { points: 10, label: "A'lo javob", icon: Star },
  { points: 15, label: "Vazifani topshirdi", icon: ThumbsUp },
  { points: 20, label: "G'olib", icon: Trophy },
];
const QUICK_NEGATIVE = [
  { points: -5, label: "Kechikdi", icon: TrendingDown },
  { points: -10, label: "Vazifa yo'q", icon: ThumbsDown },
  { points: -15, label: "Intizom", icon: Target },
  { points: -20, label: "Darsdan qoldi", icon: Flame },
];

type Period = "today" | "week" | "month" | "all";

function startOf(p: Period) {
  const d = new Date();
  if (p === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (p === "week") { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if (p === "month") { d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d; }
  return new Date(0);
}

function ScoresPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState("");
  const [quickFor, setQuickFor] = useState<any | null>(null);

  const load = async () => {
    const [g, s, e] = await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("students").select("*, groups(name)").order("full_name"),
      supabase.from("score_events").select("*, students(full_name, group_id)").order("created_at", { ascending: false }),
    ]);
    setGroups(g.data ?? []);
    setStudents(s.data ?? []);
    setAllEvents(e.data ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const periodEvents = useMemo(() => {
    const since = startOf(period).getTime();
    return allEvents.filter((e) => new Date(e.created_at).getTime() >= since);
  }, [allEvents, period]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    periodEvents.forEach((d) => { t[d.student_id] = (t[d.student_id] ?? 0) + d.points; });
    return t;
  }, [periodEvents]);

  const filtered = useMemo(() => {
    let list = students;
    if (filterGroup !== "all") list = list.filter((s) => s.group_id === filterGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [students, filterGroup, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)),
    [filtered, totals],
  );

  const stats = useMemo(() => {
    let pos = 0, neg = 0, posCount = 0, negCount = 0;
    periodEvents.forEach((e) => {
      if (filterGroup !== "all" && e.students?.group_id !== filterGroup) return;
      if (e.points > 0) { pos += e.points; posCount++; } else { neg += e.points; negCount++; }
    });
    return { pos, neg, posCount, negCount, total: pos + neg };
  }, [periodEvents, filterGroup]);

  const top10Chart = useMemo(
    () => sorted.slice(0, 10).map((s) => ({ name: s.full_name.split(" ")[0], ball: totals[s.id] ?? 0 })),
    [sorted, totals],
  );

  const give = async (sid: string, pts: number, why: string) => {
    if (!user) return;
    const { error } = await supabase.from("score_events").insert({
      teacher_id: user.id, student_id: sid, points: pts, reason: why,
    });
    if (error) return toast.error(error.message);
    toast.success(pts > 0 ? `+${pts} ball berildi` : `${pts} ball ayrildi`);
    load();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !reason) return;
    await give(studentId, points, reason);
    setStudentId(""); setReason(""); setPoints(5); setOpen(false);
  };

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from("score_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const exportCsv = () => {
    const rows = [["O'quvchi", "Guruh", "Ball", "Sabab", "Sana"]];
    periodEvents.forEach((e) => {
      const stu = students.find((s) => s.id === e.student_id);
      rows.push([
        e.students?.full_name ?? "",
        stu?.groups?.name ?? "",
        String(e.points),
        e.reason,
        new Date(e.created_at).toLocaleString("uz-UZ"),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ballar-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-4 w-4 text-warning" />;
    if (i === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (i === 2) return <Award className="h-4 w-4 text-warning/70" />;
    return <span className="text-xs font-display font-bold text-muted-foreground">{i + 1}</span>;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Ballar</h1>
          <p className="mt-1 text-muted-foreground">Mukofot va jarima ballari, reyting va tarix</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Ball berish</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yangi ball</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>O'quvchi</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name} {s.groups?.name ? `(${s.groups.name})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ball (manfiy = jarima)</Label>
                  <Input type="number" required value={points} onChange={(e) => setPoints(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Sabab</Label>
                  <Input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Faol qatnashdi / Vazifa bajarmadi" />
                </div>
                <Button type="submit" className="w-full">Saqlash</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Umumiy balans" value={stats.total} tone={stats.total >= 0 ? "primary" : "destructive"} icon={Trophy} />
        <StatCard label="Mukofot ballari" value={`+${stats.pos}`} tone="success" icon={TrendingUp} sub={`${stats.posCount} marta`} />
        <StatCard label="Jarima ballari" value={stats.neg} tone="destructive" icon={TrendingDown} sub={`${stats.negCount} marta`} />
        <StatCard label="O'quvchilar" value={filtered.length} tone="muted" icon={Star} />
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Qidirish</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="O'quvchi ismi..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Guruh</Label>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hammasi</SelectItem>
                {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Davr</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="week">Hafta</SelectItem>
                <SelectItem value="month">Oy</SelectItem>
                <SelectItem value="all">Hammasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Top 10 chart */}
      {top10Chart.some((d) => d.ball !== 0) && (
        <Card className="mb-6 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <h2 className="font-display text-lg font-bold">Top 10 reyting</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="ball" radius={[8, 8, 0, 0]}>
                  {top10Chart.map((d, i) => (
                    <Cell key={i} fill={d.ball >= 0 ? "oklch(0.65 0.18 145)" : "oklch(0.62 0.22 25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Tabs defaultValue="rating">
        <TabsList className="mb-4">
          <TabsTrigger value="rating">Reyting</TabsTrigger>
          <TabsTrigger value="history">Tarix ({periodEvents.length})</TabsTrigger>
          <TabsTrigger value="quick">Tezkor amallar</TabsTrigger>
        </TabsList>

        {/* Rating */}
        <TabsContent value="rating" className="space-y-2">
          {sorted.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">O'quvchi topilmadi</Card>
          ) : sorted.map((s, i) => {
            const pts = totals[s.id] ?? 0;
            return (
              <Card key={s.id} className="flex items-center gap-3 p-3">
                <div className="flex w-7 items-center justify-center">{rankIcon(i)}</div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{s.full_name}</div>
                  {s.groups?.name && <div className="text-xs text-muted-foreground">{s.groups.name}</div>}
                </div>
                <Badge variant={pts > 0 ? "default" : pts < 0 ? "destructive" : "secondary"} className="gap-1">
                  <Trophy className="h-3 w-3" /> {pts > 0 ? `+${pts}` : pts}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setQuickFor(s)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </Card>
            );
          })}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-2">
          {periodEvents.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Hali yozuv yo'q</Card>
          ) : periodEvents.slice(0, 100).map((e) => (
            <Card key={e.id} className="group flex items-center gap-3 p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                e.points > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}>
                {e.points > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{e.students?.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{e.reason}</div>
              </div>
              <div className="text-right">
                <Badge variant={e.points > 0 ? "default" : "destructive"}>
                  {e.points > 0 ? `+${e.points}` : e.points}
                </Badge>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleDateString("uz-UZ")}
                </div>
              </div>
              <button onClick={() => removeEvent(e.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </TabsContent>

        {/* Quick presets */}
        <TabsContent value="quick">
          <Card className="p-4">
            <p className="mb-3 text-sm text-muted-foreground">Reytingdagi <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">+</kbd> tugmasini bosing va presetlardan birini tanlang.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success"><TrendingUp className="h-4 w-4" /> Mukofot</h3>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_POSITIVE.map((q) => (
                    <div key={q.points} className="flex items-center gap-2 rounded-md border bg-success/5 px-3 py-2 text-sm">
                      <q.icon className="h-4 w-4 text-success" />
                      <span className="flex-1 truncate">{q.label}</span>
                      <span className="font-mono font-bold text-success">+{q.points}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive"><TrendingDown className="h-4 w-4" /> Jarima</h3>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_NEGATIVE.map((q) => (
                    <div key={q.points} className="flex items-center gap-2 rounded-md border bg-destructive/5 px-3 py-2 text-sm">
                      <q.icon className="h-4 w-4 text-destructive" />
                      <span className="flex-1 truncate">{q.label}</span>
                      <span className="font-mono font-bold text-destructive">{q.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick give dialog */}
      <Dialog open={!!quickFor} onOpenChange={(o) => !o && setQuickFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{quickFor?.full_name} uchun ball</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-success">Mukofot</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_POSITIVE.map((q) => (
                  <button
                    key={q.points}
                    onClick={async () => { await give(quickFor.id, q.points, q.label); setQuickFor(null); }}
                    className="flex items-center gap-2 rounded-md border bg-success/10 px-3 py-2 text-sm hover:bg-success/20"
                  >
                    <q.icon className="h-4 w-4 text-success" />
                    <span className="flex-1 truncate text-left">{q.label}</span>
                    <span className="font-mono font-bold text-success">+{q.points}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-destructive">Jarima</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_NEGATIVE.map((q) => (
                  <button
                    key={q.points}
                    onClick={async () => { await give(quickFor.id, q.points, q.label); setQuickFor(null); }}
                    className="flex items-center gap-2 rounded-md border bg-destructive/10 px-3 py-2 text-sm hover:bg-destructive/20"
                  >
                    <q.icon className="h-4 w-4 text-destructive" />
                    <span className="flex-1 truncate text-left">{q.label}</span>
                    <span className="font-mono font-bold text-destructive">{q.points}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label, value, tone, icon: Icon, sub,
}: { label: string; value: any; tone: "primary" | "success" | "destructive" | "muted"; icon: any; sub?: string }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-extrabold">{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}
