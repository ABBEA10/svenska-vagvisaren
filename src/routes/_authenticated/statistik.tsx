import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, passProbability } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/statistik")({
  head: () => ({
    meta: [
      { title: "Statistik – Körkortscoachen AI" },
      { name: "description", content: "Teoriresultat, körlogg och chans att klara provet." },
      { property: "og:title", content: "Statistik – Körkortscoachen AI" },
      { property: "og:description", content: "Teoriresultat, körlogg och chans att klara provet." },
    ],
  }),
  component: StatsPage,
});

const accConfig = { pct: { label: "Rätt %", color: "var(--chart-1)" } } satisfies ChartConfig;
const catConfig = { pct: { label: "Rätt %", color: "var(--chart-2)" } } satisfies ChartConfig;
const driveConfig = { min: { label: "Minuter", color: "var(--chart-3)" } } satisfies ChartConfig;

function weekKey(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(5, 10);
}

function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [a, s] = await Promise.all([
        supabase.from("quiz_attempts").select("category, correct, created_at, difficulty").order("created_at").limit(5000),
        supabase.from("driving_sessions").select("session_date, minutes").order("session_date"),
      ]);
      return { attempts: a.data ?? [], sessions: s.data ?? [] };
    },
  });
  if (isLoading || !data) return <div className="flex justify-center p-16"><Loader2 className="animate-spin" /></div>;
  const { attempts, sessions } = data;

  const byDay = new Map<string, { t: number; c: number }>();
  for (const a of attempts) {
    const k = a.created_at.slice(5, 10);
    const v = byDay.get(k) ?? { t: 0, c: 0 };
    v.t++;
    if (a.correct) v.c++;
    byDay.set(k, v);
  }
  const accData = [...byDay.entries()].slice(-30).map(([day, v]) => ({ day, pct: Math.round((v.c / v.t) * 100) }));
  const catData = CATEGORIES.map((c) => {
    const xs = attempts.filter((a) => a.category === c);
    return { cat: c.slice(0, 8), pct: xs.length ? Math.round((xs.filter((x) => x.correct).length / xs.length) * 100) : 0 };
  });
  const driveMap = new Map<string, number>();
  for (const s of sessions) {
    const k = weekKey(new Date(s.session_date));
    driveMap.set(k, (driveMap.get(k) ?? 0) + s.minutes);
  }
  const driveData = [...driveMap.entries()].slice(-12).map(([week, min]) => ({ week, min }));

  const recent = attempts.slice(-65);
  const acc = recent.length ? recent.filter((a) => a.correct).length / recent.length : 0;
  const prob = recent.length >= 20 ? Math.round(passProbability(acc) * 100) : null;
  const examCount = new Set(attempts.filter((a) => a.difficulty === "prov").map((a) => a.created_at.slice(0, 16))).size;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Statistik</h1>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="tile bg-primary p-5 text-primary-foreground">
          <div className="text-sm font-semibold opacity-80">Chans att klara teoriprovet</div>
          <div className="font-display text-5xl font-extrabold">{prob === null ? "–" : `${prob}%`}</div>
          <p className="mt-1 text-sm opacity-90">
            {prob === null
              ? "Svara på minst 20 frågor för en uppskattning."
              : `Baserat på dina senaste ${recent.length} svar (${Math.round(acc * 100)}% rätt). Godkänt kräver 52 av 65.`}
          </p>
        </div>
        <div className="tile p-5">
          <div className="text-sm text-muted-foreground">Besvarade frågor</div>
          <div className="font-display text-4xl font-extrabold">{attempts.length}</div>
          <div className="text-xs text-muted-foreground">{examCount} simulerade prov</div>
        </div>
        <div className="tile p-5">
          <div className="text-sm text-muted-foreground">Körtid totalt</div>
          <div className="font-display text-4xl font-extrabold">{(sessions.reduce((s, x) => s + x.minutes, 0) / 60).toFixed(1)} h</div>
          <div className="text-xs text-muted-foreground">{sessions.length} körningar</div>
        </div>
      </div>

      <div className="tile p-5">
        <h2 className="mb-4 font-bold">Teoriresultat per dag</h2>
        {accData.length ? (
          <ChartContainer config={accConfig} className="h-56 w-full">
            <LineChart data={accData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} width={30} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="pct" stroke="var(--color-pct)" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        ) : <Empty />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="tile p-5">
          <h2 className="mb-4 font-bold">Kategoripoäng</h2>
          <ChartContainer config={catConfig} className="h-56 w-full">
            <BarChart data={catData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="cat" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis domain={[0, 100]} width={30} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pct" fill="var(--color-pct)" radius={6} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="tile p-5">
          <h2 className="mb-4 font-bold">Körtid per vecka</h2>
          {driveData.length ? (
            <ChartContainer config={driveConfig} className="h-56 w-full">
              <BarChart data={driveData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis width={30} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="min" fill="var(--color-min)" radius={6} />
              </BarChart>
            </ChartContainer>
          ) : <Empty />}
        </div>
      </div>
    </div>
  );
}

function Empty({ className }: { className?: string }) {
  return <div className={cn("py-10 text-center text-sm text-muted-foreground", className)}>Ingen data ännu.</div>;
}
