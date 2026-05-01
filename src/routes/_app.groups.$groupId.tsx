import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Phone, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/groups/$groupId")({
  component: GroupDetail,
});

function GroupDetail() {
  const { groupId } = Route.useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const load = async () => {
    const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).single();
    setGroup(g);
    const { data: ss } = await supabase.from("students").select("*").eq("group_id", groupId).order("full_name");
    setStudents(ss ?? []);
    const { data: sc } = await supabase.from("score_events").select("student_id, points");
    const totals: Record<string, number> = {};
    (sc ?? []).forEach((e: any) => (totals[e.student_id] = (totals[e.student_id] ?? 0) + e.points));
    setScores(totals);
  };

  useEffect(() => { load(); }, [groupId]);

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("students").insert({
      teacher_id: user.id, group_id: groupId, full_name: name, phone: phone || null,
    });
    if (error) return toast.error(error.message);
    toast.success("O‘quvchi qo‘shildi");
    setName(""); setPhone(""); setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("O‘quvchi o‘chirilsinmi?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
      <Link to="/groups" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Guruhlar
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{group?.name ?? "..."}</h1>
          {group?.description && <p className="mt-1 text-muted-foreground">{group.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{students.length} o‘quvchi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> O‘quvchi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi o‘quvchi</DialogTitle></DialogHeader>
            <form onSubmit={addStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sname">Ism familiya</Label>
                <Input id="sname" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sphone">Telefon (ixtiyoriy)</Label>
                <Input id="sphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 ..." />
              </div>
              <Button type="submit" className="w-full">Saqlash</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {students.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Hali o‘quvchi qo‘shilmagan</Card>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const pts = scores[s.id] ?? 0;
            return (
              <Card key={s.id} className="group flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.full_name}</div>
                  {s.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {s.phone}
                    </div>
                  )}
                </div>
                <Badge variant={pts > 0 ? "default" : pts < 0 ? "destructive" : "secondary"} className="gap-1">
                  <Trophy className="h-3 w-3" /> {pts > 0 ? `+${pts}` : pts}
                </Badge>
                <button onClick={() => remove(s.id)} className="rounded p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
