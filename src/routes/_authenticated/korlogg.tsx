import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { DRIVING_SKILLS, XP } from "@/lib/domain";
import { awardXp } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/korlogg")({
  head: () => ({
    meta: [
      { title: "Körlogg – Körkortscoachen AI" },
      { name: "description", content: "Logga dina övningskörningar och följ din utveckling." },
      { property: "og:title", content: "Körlogg – Körkortscoachen AI" },
      { property: "og:description", content: "Logga dina övningskörningar och följ din utveckling." },
    ],
  }),
  component: LogPage,
});

function LogPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState(45);
  const [skills, setSkills] = useState<string[]>([]);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("driving_sessions").select("*").order("session_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const sessions = data ?? [];
  const totalMin = sessions.reduce((s, x) => s + x.minutes, 0);
  const avg = sessions.length ? sessions.reduce((s, x) => s + x.rating, 0) / sessions.length : 0;
  const skillCount = DRIVING_SKILLS.map((s) => ({ s, n: sessions.filter((x) => x.skills.includes(s)).length }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("driving_sessions").insert({
      user_id: u.user!.id,
      session_date: date,
      minutes,
      skills,
      rating,
      notes: notes || null,
    });
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    toast.success(`Körning sparad! +${XP.drivingSession} XP`);
    await awardXp(XP.drivingSession);
    setSkills([]);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  async function remove(id: string) {
    await supabase.from("driving_sessions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Körlogg</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="tile p-4"><div className="text-sm text-muted-foreground">Körningar</div><div className="font-display text-3xl font-extrabold">{sessions.length}</div></div>
        <div className="tile p-4"><div className="text-sm text-muted-foreground">Timmar</div><div className="font-display text-3xl font-extrabold">{(totalMin / 60).toFixed(1)}</div></div>
        <div className="tile p-4"><div className="text-sm text-muted-foreground">Snittbetyg</div><div className="font-display text-3xl font-extrabold">{avg ? avg.toFixed(1) : "–"}</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={save} className="tile space-y-4 p-5">
          <h2 className="text-xl font-bold">Ny körning</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Datum</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Minuter</Label><Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(+e.target.value)} required /></div>
          </div>
          <div>
            <Label>Moment</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DRIVING_SKILLS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s])}
                  className={cn("rounded-full border-2 px-3 py-1 text-sm", skills.includes(s) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Självskattning</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stjärnor`}>
                  <Star className={cn("size-7", n <= rating ? "fill-sign text-sign" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Anteckningar</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vad gick bra? Vad ska du öva mer på?" /></div>
          <Button type="submit" className="w-full">Spara körning</Button>
        </form>

        <div className="space-y-4">
          <div className="tile p-5">
            <h2 className="mb-3 font-bold">Tränade moment</h2>
            <div className="space-y-2">
              {skillCount.map(({ s, n }) => (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0">{s}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${sessions.length ? (n / sessions.length) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="tile flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold">{s.session_date} · {s.minutes} min · {"★".repeat(s.rating)}</div>
                  <div className="text-sm text-muted-foreground">{s.skills.join(", ") || "Inga moment valda"}</div>
                  {s.notes && <p className="mt-1 text-sm">{s.notes}</p>}
                </div>
                <button onClick={() => remove(s.id)} aria-label="Ta bort" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
