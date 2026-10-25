import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { generateStudyPlan, type StudyPlan } from "@/lib/ai.functions";
import { CATEGORIES, daysUntil } from "@/lib/domain";
import { awardXp } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/schema")({
  head: () => ({
    meta: [
      { title: "8-veckorsschema – Körkortscoachen AI" },
      { name: "description", content: "Ditt personliga studieschema som anpassas efter dina resultat." },
      { property: "og:title", content: "8-veckorsschema – Körkortscoachen AI" },
      { property: "og:description", content: "Ditt personliga studieschema som anpassas efter dina resultat." },
    ],
  }),
  component: PlanPage,
});

const DAY_NAMES = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const TYPE_LABEL: Record<string, string> = {
  teori: "Teori", flashcards: "Flashcards", korning: "Körning", coach: "Coach", prov: "Prov", vila: "Vila",
};

function linkFor(type: string, category: string) {
  if (type === "teori" && (CATEGORIES as readonly string[]).includes(category)) return { to: "/teori" as const, search: { category } };
  if (type === "teori" || type === "prov") return { to: "/teori" as const, search: {} };
  if (type === "flashcards") return { to: "/flashcards" as const };
  if (type === "korning") return { to: "/korlogg" as const };
  if (type === "coach") return { to: "/coach" as const };
  return null;
}

function PlanPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateStudyPlan);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      const { data } = await supabase.from("study_plans").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  async function create() {
    setCreating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const [{ data: profile }, { data: attempts }, { data: sessions }] = await Promise.all([
        supabase.from("profiles").select("theory_date, driving_date").eq("id", u.user!.id).maybeSingle(),
        supabase.from("quiz_attempts").select("category, correct").limit(1000),
        supabase.from("driving_sessions").select("minutes"),
      ]);
      const stats = CATEGORIES.map((c) => {
        const a = (attempts ?? []).filter((x) => x.category === c);
        return { c, pct: a.length ? a.filter((x) => x.correct).length / a.length : null };
      });
      const today = new Date();
      await gen({
        data: {
          weak: stats.filter((s) => s.pct === null || s.pct < 0.75).map((s) => s.c),
          strong: stats.filter((s) => s.pct !== null && s.pct >= 0.85).map((s) => s.c),
          theoryDays: daysUntil(profile?.theory_date ?? null, today),
          drivingDays: daysUntil(profile?.driving_date ?? null, today),
          drivingHours: Math.round((sessions ?? []).reduce((s, x) => s + x.minutes, 0) / 60),
        },
      });
      toast.success("Ditt schema är klart!");
      qc.invalidateQueries({ queryKey: ["plan"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte skapa schema");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(key: string) {
    if (!data) return;
    const done = data.completed.includes(key);
    const completed = done ? data.completed.filter((k) => k !== key) : [...data.completed, key];
    await supabase.from("study_plans").update({ completed }).eq("id", data.id);
    if (!done) await awardXp(15);
    qc.invalidateQueries({ queryKey: ["plan"] });
  }

  if (isLoading) return <div className="flex justify-center p-16"><Loader2 className="animate-spin" /></div>;

  const plan = data?.plan as StudyPlan | undefined;
  const start = data ? new Date(data.start_date) : new Date();
  const dayIndex = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  const currentWeek = Math.min(7, Math.max(0, Math.floor(dayIndex / 7)));
  const totalTasks = plan?.weeks.reduce((s, w) => s + w.days.filter((d) => d.type !== "vila").length, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">8-veckorsschema</h1>
          <p className="text-muted-foreground">Anpassat efter dina resultat och provdatum.</p>
        </div>
        <Button variant={plan ? "outline" : "default"} onClick={create} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" /> : <RefreshCw />} {plan ? "Anpassa om efter mina resultat" : "Skapa mitt schema"}
        </Button>
      </div>

      {creating && <p className="text-sm text-muted-foreground">AI:n planerar dina 8 veckor… det tar ungefär en halv minut.</p>}

      {!plan ? (
        <div className="tile p-8 text-center text-muted-foreground">Inget schema ännu. Skapa ett så får du dagliga uppgifter i 8 veckor.</div>
      ) : (
        <>
          <div className="tile p-5">
            <div className="mb-2 flex justify-between text-sm font-semibold">
              <span>Totalt genomfört</span>
              <span>{data!.completed.length}/{totalTasks}</span>
            </div>
            <Progress value={totalTasks ? (data!.completed.length / totalTasks) * 100 : 0} className="h-3" />
          </div>
          <div className="space-y-4">
            {plan.weeks.map((w, wi) => {
              const done = w.days.filter((_, di) => data!.completed.includes(`${wi}-${di}`)).length;
              return (
                <div key={wi} className={cn("tile p-4", wi === currentWeek && "border-primary")}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                      Vecka {wi + 1} <span className="font-normal text-muted-foreground">· {w.focus}</span>
                    </h2>
                    <span className="text-sm text-muted-foreground">{done}/{w.days.filter((d) => d.type !== "vila").length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-7">
                    {w.days.slice(0, 7).map((d, di) => {
                      const key = `${wi}-${di}`;
                      const isDone = data!.completed.includes(key);
                      const isToday = wi * 7 + di === dayIndex;
                      const link = linkFor(d.type, d.category);
                      return (
                        <div
                          key={di}
                          className={cn(
                            "flex flex-col gap-1 rounded-xl border-2 p-2.5 text-sm",
                            isDone && "border-success bg-success/10",
                            isToday && !isDone && "border-primary",
                            d.type === "vila" && "opacity-60",
                          )}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            {DAY_NAMES[di]} · {TYPE_LABEL[d.type]}
                            {d.type !== "vila" && (
                              <button
                                onClick={() => toggle(key)}
                                aria-label="Markera som klar"
                                className={cn("flex size-5 items-center justify-center rounded-md border-2", isDone && "border-success bg-success text-success-foreground")}
                              >
                                {isDone && <Check className="size-3" />}
                              </button>
                            )}
                          </div>
                          {link ? (
                            <Link {...link} className="font-medium leading-snug hover:underline">{d.title}</Link>
                          ) : (
                            <span className="font-medium leading-snug">{d.title}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
