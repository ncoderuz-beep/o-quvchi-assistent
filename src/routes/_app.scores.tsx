import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trophy, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/scores")({
  component: ScoresPage,
});

const QUICK = [
  { points: 5, label: "+5 Faollik" },
  { points: 10, label: "+10 A'lo" },
  { points: -5, label: "-5 Kechikdi" },
  { points: -10, label: "-10 Vazifa yo‘q" },
];

function ScoresPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState("");

  const load = async () => {
    const [g, s, e] = await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("students").select("*, groups(name)").order("full_name"),
      supabase.from("score_events").select("*, students(full_name)").order("created_at", { ascending: false }).limit(50),
    ]);
    setGroups(g.data ?? []);
    setStudents(s.data ?? []);
    setEvents(e.data ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const totals: Record<string, number> = {};
  events.forEach(() => {});
  // recompute from all events (not just last 50) — separate query for accuracy
  const [allTotals, setAllTotals] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user) return;
    supabase.from("score_events").select("student_id, points").then(({ data }) => {
      const t: Record<string, number> = {};
      (data ?? []).forEach((d: any) => (t[d.student_id] = (t[d.student_id] ?? 0) + d.points));
      setAllTotals(t);
    });
  }, [user, events.length]);

  const filtered = filterGroup === "all" ? students : students.filter((s) => s.group_id === filterGroup);
  const sorted = [...filtered].sort((a, b) => (allTotals[b.id] ?? 0) - (allTotals[a.id] ?? 0));

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Ballar</h1>
          <p className="mt-1 text-muted-foreground">Mukofot va jarima ballari</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Ball berish</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi ball</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>O‘quvchi</Label>
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

      <Card className="mb-6 p-4">
        <Label className="text-xs">Guruh bo‘yicha filtr</Label>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold">Reyting</h2>
          {sorted.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">O‘quvchi yo‘q</Card>
          ) : (
            <div className="space-y-2">
              {sorted.map((s, i) => {
                const pts = allTotals[s.id] ?? 0;
                return (
                  <Card key={s.id} className="flex items-center gap-3 p-3">
                    <div className="w-6 text-center font-display font-bold text-muted-foreground">{i + 1}</div>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
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
                    <div className="hidden gap-1 sm:flex">
                      {QUICK.slice(0, 2).map((q) => (
                        <button key={q.points} onClick={() => give(s.id, q.points, q.label)}
                          className="rounded-md bg-success/15 px-2 py-1 text-xs font-medium text-success hover:bg-success/25">
                          +{q.points}
                        </button>
                      ))}
                      {QUICK.slice(2).map((q) => (
                        <button key={q.points} onClick={() => give(s.id, q.points, q.label)}
                          className="rounded-md bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/25">
                          {q.points}
                        </button>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold">Oxirgi yozuvlar</h2>
          {events.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">Hali yozuv yo‘q</Card>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <Card key={e.id} className="group flex items-center gap-3 p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    e.points > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}>
                    {e.points > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{e.students?.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.reason}</div>
                  </div>
                  <Badge variant={e.points > 0 ? "default" : "destructive"}>
                    {e.points > 0 ? `+${e.points}` : e.points}
                  </Badge>
                  <button onClick={() => removeEvent(e.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
