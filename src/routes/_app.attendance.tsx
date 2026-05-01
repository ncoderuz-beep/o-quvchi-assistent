import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
});

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: { key: Status; label: string; icon: any; cls: string }[] = [
  { key: "present", label: "Keldi", icon: Check, cls: "bg-success text-success-foreground" },
  { key: "absent", label: "Kelmadi", icon: X, cls: "bg-destructive text-destructive-foreground" },
  { key: "late", label: "Kech", icon: Clock, cls: "bg-warning text-warning-foreground" },
  { key: "excused", label: "Sababli", icon: FileText, cls: "bg-info text-info-foreground" },
];

function AttendancePage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("groups").select("*").order("name").then(({ data }) => {
      setGroups(data ?? []);
      if (data?.[0]) setGroupId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      const { data: ss } = await supabase.from("students").select("*").eq("group_id", groupId).order("full_name");
      setStudents(ss ?? []);
      const { data: att } = await supabase.from("attendance").select("student_id, status").eq("date", date);
      const m: Record<string, Status> = {};
      (att ?? []).forEach((a: any) => (m[a.student_id] = a.status));
      setMarks(m);
    })();
  }, [groupId, date]);

  const mark = async (studentId: string, status: Status) => {
    if (!user) return;
    setMarks((m) => ({ ...m, [studentId]: status }));
    const { error } = await supabase.from("attendance").upsert(
      { teacher_id: user.id, student_id: studentId, date, status },
      { onConflict: "student_id,date" }
    );
    if (error) toast.error(error.message);
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.key] = Object.values(marks).filter((v) => v === s.key).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-3xl font-extrabold">Davomat</h1>
      <p className="mt-1 text-muted-foreground">Sana va guruhni tanlab, har bir o‘quvchi uchun belgilang</p>

      <Card className="mt-6 grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Guruh</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sana</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </Card>

      {students.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          {STATUSES.map((s) => (
            <div key={s.key} className="rounded-lg border bg-card p-2">
              <div className="text-muted-foreground">{s.label}</div>
              <div className="mt-0.5 font-display text-lg font-bold">{counts[s.key]}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {groups.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">Avval guruh va o‘quvchi qo‘shing</Card>
        ) : students.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">Bu guruhda o‘quvchi yo‘q</Card>
        ) : (
          students.map((s) => (
            <Card key={s.id} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 truncate font-medium">{s.full_name}</div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {STATUSES.map((st) => {
                  const Icon = st.icon;
                  const active = marks[s.id] === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => mark(s.id, st.key)}
                      className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition ${
                        active ? st.cls + " border-transparent shadow-[var(--shadow-elegant)]" : "hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
