import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BookMarked, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { analyzeWeaknesses, type Analysis } from "@/lib/ai.functions";
import { CATEGORIES } from "@/lib/domain";
import { SOURCES } from "@/lib/sources";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analys")({
  head: () => ({
    meta: [
      { title: "Svaghetsanalys – Körkortscoachen AI" },
      { name: "description", content: "AI hittar dina problemområden och ger extra övningar." },
      { property: "og:title", content: "Svaghetsanalys – Körkortscoachen AI" },
      { property: "og:description", content: "AI hittar dina problemområden och ger extra övningar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const analyze = useServerFn(analyzeWeaknesses);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const { data: attempts } = useQuery({
    queryKey: ["attempts-all"],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("category, correct, created_at").order("created_at").limit(2000);
      return data ?? [];
    },
  });

  const twoWeeks = Date.now() - 14 * 86_400_000;
  const rows = CATEGORIES.map((c) => {
    const all = (attempts ?? []).filter((a) => a.category === c);
    const older = all.filter((a) => new Date(a.created_at).getTime() < twoWeeks);
    const recent = all.filter((a) => new Date(a.created_at).getTime() >= twoWeeks);
    const pct = (xs: typeof all) => (xs.length ? Math.round((xs.filter((x) => x.correct).length / xs.length) * 100) : null);
    return { c, total: all.length, pct: pct(all), recent: pct(recent), older: pct(older) };
  }).sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1));

  async function run() {
    setLoading(true);
    setAnswers({});
    try {
      setResult(await analyze());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte analysera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Svaghetsanalys</h1>
          <p className="text-muted-foreground">Var tappar du poäng – och hur utvecklas du?</p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <AlertTriangle />} Analysera mig med AI
        </Button>
      </div>

      <div className="tile p-5">
        <h2 className="mb-3 text-lg font-bold">Utveckling per kategori</h2>
        <p className="mb-4 text-sm text-muted-foreground">Senaste 14 dagarna jämfört med tidigare.</p>
        <div className="space-y-3">
          {rows.map((r) => {
            const diff = r.recent !== null && r.older !== null ? r.recent - r.older : null;
            return (
              <div key={r.c} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-sm font-medium">{r.c}</div>
                <Progress value={r.pct ?? 0} className="h-2.5 flex-1" />
                <div className="w-14 text-right text-sm tabular-nums">{r.pct === null ? "–" : `${r.pct}%`}</div>
                <div className={cn("flex w-14 items-center justify-end gap-0.5 text-xs font-semibold", diff !== null && diff >= 0 ? "text-success" : "text-destructive")}>
                  {diff === null ? <span className="text-muted-foreground">ny</span> : (
                    <>{diff >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}{diff > 0 ? "+" : ""}{diff}</>
                  )}
                </div>
                <Button asChild size="sm" variant="ghost"><Link to="/teori" search={{ category: r.c }}>Öva</Link></Button>
              </div>
            );
          })}
        </div>
      </div>

      {result && (
        <>
          <div className="tile space-y-3 p-5">
            <h2 className="text-lg font-bold">Coachens analys</h2>
            <p>{result.summary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {result.problems.map((p, i) => (
                <div key={i} className="rounded-xl bg-muted p-4">
                  <div className="font-bold">{p.area}</div>
                  <p className="text-sm text-muted-foreground">{p.why}</p>
                  <p className="mt-2 text-sm"><span className="font-semibold">Gör så här:</span> {p.action}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Extra övningar för dig</h2>
            {result.exercises.map((q, qi) => {
              const picked = answers[qi];
              const src = SOURCES[q.sourceKey];
              return (
                <div key={qi} className="tile space-y-3 p-4">
                  <span className="rounded-full bg-sign px-2.5 py-0.5 text-xs font-bold text-sign-foreground">{q.category}</span>
                  <p className="font-semibold">{q.question}</p>
                  <div className="grid gap-2">
                    {q.options.map((o, oi) => (
                      <button
                        key={oi}
                        disabled={picked !== undefined}
                        onClick={() => setAnswers({ ...answers, [qi]: oi })}
                        className={cn(
                          "rounded-xl border-2 px-3 py-2 text-left text-sm",
                          picked === undefined && "hover:bg-muted",
                          picked !== undefined && oi === q.correctIndex && "border-success bg-success text-success-foreground",
                          picked === oi && oi !== q.correctIndex && "border-destructive bg-destructive text-destructive-foreground",
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  {picked !== undefined && (
                    <div className="rounded-xl bg-muted p-3 text-sm">
                      <p>{q.explanation}</p>
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 bg-card px-2.5 py-1 text-xs font-semibold hover:border-primary">
                        <BookMarked className="size-3.5" /> Källa: {src.name} · {q.sourceRef} ↗
                      </a>
                      <p className="mt-1 text-xs text-muted-foreground">AI-genererat svar – hänvisningen är inte faktagranskad.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
