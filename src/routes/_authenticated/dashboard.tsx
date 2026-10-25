import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Flame, Lightbulb, Loader2, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { dailyTip } from "@/lib/ai.functions";
import { CATEGORIES, daysUntil, levelFromXp, levelTitle } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Översikt – Körkortscoachen AI" },
      { name: "description", content: "Din studienivå, veckomål och nedräkning till proven." },
      { property: "og:title", content: "Översikt – Körkortscoachen AI" },
      { property: "og:description", content: "Din studienivå, veckomål och nedräkning till proven." },
    ],
  }),
  component: Dashboard,
});

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [profile, attempts, sessions] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("quiz_attempts").select("category, correct, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("driving_sessions").select("session_date, minutes"),
      ]);
      return { profile: profile.data, attempts: attempts.data ?? [], sessions: sessions.data ?? [] };
    },
  });
}

function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const tipFn = useServerFn(dailyTip);
  const [tip, setTip] = useState<{ title: string; tip: string } | null>(null);
  const [tipLoading, setTipLoading] = useState(false);

  if (isLoading || !data) {
    return <div className="flex justify-center p-16"><Loader2 className="animate-spin" /></div>;
  }
  const { profile, attempts, sessions } = data;
  const xp = profile?.xp ?? 0;
  const lvl = levelFromXp(xp);
  const today = new Date();

  const byCat = CATEGORIES.map((c) => {
    const a = attempts.filter((x) => x.category === c);
    const correct = a.filter((x) => x.correct).length;
    return { category: c, total: a.length, pct: a.length ? Math.round((correct / a.length) * 100) : 0 };
  });
  const tried = byCat.filter((c) => c.total > 0);
  const weakest = tried.length ? [...tried].sort((a, b) => a.pct - b.pct)[0] : null;
  const untried = byCat.find((c) => c.total === 0);
  const recent = attempts.slice(0, 100);
  const overall = recent.length ? Math.round((recent.filter((a) => a.correct).length / recent.length) * 100) : 0;
  const coverage = Math.round((tried.length / CATEGORIES.length) * 100);
  const progressPct = Math.round(overall * 0.7 + coverage * 0.3);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const ws = weekStart.toISOString().slice(0, 10);
  const studyDays = new Set([
    ...attempts.filter((a) => a.created_at.slice(0, 10) >= ws).map((a) => a.created_at.slice(0, 10)),
    ...sessions.filter((s) => s.session_date >= ws).map((s) => s.session_date),
  ]).size;
  const goal = profile?.weekly_goal ?? 5;

  const taskCategory = untried?.category ?? weakest?.category ?? CATEGORIES[0];
  const theoryDays = daysUntil(profile?.theory_date ?? null, today);
  const drivingDays = daysUntil(profile?.driving_date ?? null, today);

  async function getTip() {
    setTipLoading(true);
    try {
      setTip(await tipFn({ data: { weakest: weakest?.category ?? null } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte hämta tips");
    } finally {
      setTipLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground">Hej {profile?.display_name ?? "där"} 👋</p>
          <h1 className="text-3xl font-extrabold md:text-4xl">Dags att öva!</h1>
        </div>
        <DatesDialog theory={profile?.theory_date ?? ""} driving={profile?.driving_date ?? ""} goal={goal} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="tile p-5 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-sign font-display text-2xl font-extrabold text-sign-foreground">
              {lvl.level}
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Nivå {lvl.level}</div>
              <div className="text-xl font-bold">{levelTitle(lvl.level)}</div>
              <Progress value={lvl.progress * 100} className="mt-2 h-3" />
              <div className="mt-1 text-xs text-muted-foreground">{lvl.into} / 250 XP till nästa nivå · totalt {xp} XP</div>
            </div>
          </div>
        </div>
        <div className="tile flex items-center gap-4 p-5">
          <Flame className="size-10 text-destructive" />
          <div>
            <div className="font-display text-3xl font-extrabold">{profile?.streak ?? 0}</div>
            <div className="text-sm text-muted-foreground">dagar i rad</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Teoriprov" value={theoryDays === null ? "–" : `${theoryDays} d`} hint={theoryDays === null ? "Sätt datum" : "kvar"} />
        <Stat icon={CalendarDays} label="Uppkörning" value={drivingDays === null ? "–" : `${drivingDays} d`} hint={drivingDays === null ? "Sätt datum" : "kvar"} />
        <Stat icon={Target} label="Veckomål" value={`${studyDays}/${goal}`} hint="studiedagar" />
        <Stat icon={Trophy} label="Framsteg" value={`${progressPct}%`} hint="mot provredo" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="tile space-y-3 bg-primary p-5 text-primary-foreground">
          <div className="text-sm font-semibold opacity-80">Dagens uppgift</div>
          <h2 className="text-2xl font-extrabold">Öva {taskCategory}</h2>
          <p className="opacity-90">
            {untried ? "Ett område du inte testat än." : "Ditt svagaste område just nu."} 5 snabba frågor tar ca 3 minuter.
          </p>
          <Button asChild variant="secondary">
            <Link to="/teori">Starta övning</Link>
          </Button>
        </div>
        <div className="tile space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Lightbulb className="size-4" /> Dagens coachtips
          </div>
          {tip ? (
            <>
              <h3 className="text-lg font-bold">{tip.title}</h3>
              <p className="text-muted-foreground">{tip.tip}</p>
            </>
          ) : (
            <Button variant="outline" onClick={getTip} disabled={tipLoading}>
              {tipLoading ? <Loader2 className="animate-spin" /> : null} Få dagens tips
            </Button>
          )}
        </div>
      </div>

      <div className="tile p-5">
        <h2 className="mb-4 text-xl font-bold">Kategoripoäng</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {byCat.map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{c.category}</span>
                <span className="text-muted-foreground">{c.total ? `${c.pct}% (${c.total})` : "ej testad"}</span>
              </div>
              <Progress value={c.pct} className="h-2.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string; hint: string }) {
  return (
    <div className="tile p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-1 font-display text-3xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function DatesDialog({ theory, driving, goal }: { theory: string; driving: string; goal: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(theory);
  const [d, setD] = useState(driving);
  const [g, setG] = useState(goal);
  async function save() {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ theory_date: t || null, driving_date: d || null, weekly_goal: Math.min(7, Math.max(1, g)) })
      .eq("id", u.user!.id);
    if (error) return toast.error("Kunde inte spara");
    toast.success("Sparat!");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><CalendarDays /> Provdatum & mål</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Provdatum & veckomål</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Teoriprov</Label><Input type="date" value={t} onChange={(e) => setT(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Uppkörning</Label><Input type="date" value={d} onChange={(e) => setD(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Studiedagar per vecka</Label><Input type="number" min={1} max={7} value={g} onChange={(e) => setG(+e.target.value)} /></div>
          <Button className="w-full" onClick={save}>Spara</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
