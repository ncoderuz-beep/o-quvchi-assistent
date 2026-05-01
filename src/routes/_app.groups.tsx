import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/groups")({
  component: GroupsPage,
});

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  studentCount?: number;
}

function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: gs } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    const { data: ss } = await supabase.from("students").select("group_id");
    const counts: Record<string, number> = {};
    (ss ?? []).forEach((s: any) => (counts[s.group_id] = (counts[s.group_id] ?? 0) + 1));
    setGroups((gs ?? []).map((g: any) => ({ ...g, studentCount: counts[g.id] ?? 0 })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("groups").insert({ teacher_id: user.id, name, description: desc || null });
    if (error) return toast.error(error.message);
    toast.success("Guruh qo‘shildi");
    setName(""); setDesc(""); setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Guruh o‘chirilsinmi? Barcha o‘quvchi va davomatlar ham o‘chadi.")) return;
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("O‘chirildi");
    load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Guruhlar</h1>
          <p className="mt-1 text-muted-foreground">O‘quv guruhlaringiz ro‘yxati</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg"><Plus className="mr-1 h-4 w-4" /> Guruh</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi guruh</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gname">Guruh nomi</Label>
                <Input id="gname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: 7-A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gdesc">Izoh (ixtiyoriy)</Label>
                <Textarea id="gdesc" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Saqlash</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Hali guruh yo‘q</p>
          <p className="mt-1 text-sm text-muted-foreground">Birinchi guruhingizni qo‘shing</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="group p-5 transition hover:shadow-[var(--shadow-elegant)]">
              <div className="flex items-start justify-between">
                <Link to="/groups/$groupId" params={{ groupId: g.id }} className="flex-1">
                  <h3 className="font-display text-lg font-bold">{g.name}</h3>
                  {g.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" /> {g.studentCount} o‘quvchi
                  </div>
                </Link>
                <button onClick={() => remove(g.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Link to="/groups/$groupId" params={{ groupId: g.id }} className="mt-4 flex items-center text-sm font-medium text-primary">
                Ochish <ChevronRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
