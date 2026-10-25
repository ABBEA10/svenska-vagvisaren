import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookMarked, CheckCircle2, Clock, Image as ImageIcon, Landmark, ListChecks, Loader2, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { generateQuestions } from "@/lib/ai.functions";
import { CATEGORIES, DIFFICULTIES, XP, type Difficulty } from "@/lib/domain";
import { awardXp } from "@/lib/progress";
import { EXAM, SITUATIONS, type Question } from "@/lib/situations";
import { cn } from "@/lib/utils";
import { SOURCES } from "@/lib/sources";
import { signUrl } from "@/lib/signs";

function SourceLink({ q }: { q: Question }) {
  if (!q.sourceKey) return null;
  const src = SOURCES[q.sourceKey];
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary"
    >
      <BookMarked className="size-3.5" /> Källa: {src.name}
      {q.sourceRef ? ` · ${q.sourceRef}` : ""} ↗
    </a>
  );
}

export const Route = createFileRoute("/_authenticated/teori")({
  head: () => ({
    meta: [
      { title: "Teoriprov – Körkortscoachen AI" },
      { name: "description", content: "Obegränsade teorifrågor, simulerade Trafikverksprov och bildfrågor." },
      { property: "og:title", content: "Teoriprov – Körkortscoachen AI" },
      { property: "og:description", content: "Obegränsade teorifrågor, simulerade Trafikverksprov och bildfrågor." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { category?: string } =>
    typeof s.category === "string" ? { category: s.category } : {},
  component: TheoryPage,
});

type Mode = "practice" | "full" | "exam" | "images";
type Session = { mode: Mode; questions: Question[]; answers: (number | null)[]; endsAt?: number | undefined };

const MODES: { id: Mode; title: string; text: string; icon: typeof Zap }[] = [
  { id: "practice", title: "Snabbövning", text: "En fråga i taget med förklaring direkt", icon: Zap },
  { id: "full", title: "Kategoriprov", text: "10 frågor, resultat i slutet", icon: ListChecks },
  { id: "exam", title: "Trafikverksprov", text: `${EXAM.total} frågor · ${EXAM.minutes} min · godkänt ${EXAM.passAt}`, icon: Landmark },
  { id: "images", title: "Bildfrågor", text: "Verkliga trafiksituationer i bild", icon: ImageIcon },
];

function shuffle<T>(a: T[]) {
  return [...a].sort(() => Math.random() - 0.5);
}

function TheoryPage() {
  const gen = useServerFn(generateQuestions);
  const [mode, setMode] = useState<Mode>("practice");
  const search = Route.useSearch();
  const [category, setCategory] = useState<string>(
    search.category && (CATEGORIES as readonly string[]).includes(search.category) ? search.category : CATEGORIES[0],
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medel");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  async function start() {
    setLoading(true);
    try {
      let questions: Question[] = [];
      if (mode === "images") {
        questions = shuffle(SITUATIONS);
      } else if (mode === "exam") {
        const images = shuffle(SITUATIONS).slice(0, 5);
        const cats = shuffle([...CATEGORIES]);
        const per = Math.ceil((EXAM.total - images.length) / cats.length);
        const batches = await Promise.all(
          cats.map((c) =>
            gen({ data: { category: c, difficulty: "medel", count: per } }).then((qs) =>
              qs.map((q) => ({ ...q, category: c })),
            ),
          ),
        );
        questions = shuffle([...batches.flat(), ...images]).slice(0, EXAM.total);
      } else {
        const qs = await gen({ data: { category, difficulty, count: mode === "practice" ? 5 : 10 } });
        questions = qs.map((q) => ({ ...q, category }));
      }
      if (!questions.length) throw new Error("Inga frågor kunde skapas.");
      setSession({
        mode,
        questions,
        answers: questions.map(() => null),
        endsAt: mode === "exam" ? Date.now() + EXAM.minutes * 60_000 : undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte skapa frågor");
    } finally {
      setLoading(false);
    }
  }

  if (session) return <Quiz session={session} onExit={() => setSession(null)} onMore={start} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Teoriprov</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map(({ id, title, text, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn("tile flex items-start gap-3 p-4 text-left transition", mode === id && "border-primary")}
          >
            <div className={cn("rounded-xl p-2", mode === id ? "bg-primary text-primary-foreground" : "bg-muted")}>
              <Icon className="size-5" />
            </div>
            <div>
              <div className="font-bold">{title}</div>
              <div className="text-sm text-muted-foreground">{text}</div>
            </div>
          </button>
        ))}
      </div>

      {(mode === "practice" || mode === "full") && (
        <div className="tile space-y-4 p-5">
          <div>
            <div className="mb-2 text-sm font-semibold">Kategori</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1.5 text-sm font-medium",
                    category === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Svårighetsgrad</div>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-full border-2 px-4 py-1.5 text-sm font-medium capitalize",
                    difficulty === d ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "exam" && (
        <p className="text-sm text-muted-foreground">
          Som på riktiga provet: frågor från alla områden blandat med bildfrågor. Du ser rätt svar först när du lämnat in.
          Det tar ungefär en halv minut att skapa provet.
        </p>
      )}

      <Button size="lg" className="h-12 w-full text-base shadow-pop" onClick={start} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Skapar frågor…
          </>
        ) : (
          "Starta"
        )}
      </Button>
    </div>
  );
}

function useCountdown(endsAt: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return endsAt ? Math.max(0, endsAt - now) : null;
}

function Quiz({ session, onExit, onMore }: { session: Session; onExit: () => void; onMore: () => void }) {
  const [answers, setAnswers] = useState(session.answers);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const instant = session.mode === "practice" || session.mode === "images";
  const remaining = useCountdown(done ? undefined : session.endsAt);
  const q = session.questions[index]!;
  const picked = answers[index];

  async function finish(final = answers) {
    setDone(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const rows = session.questions.map((qq, i) => ({
      user_id: u.user!.id,
      category: qq.category,
      question: qq.question.slice(0, 500),
      correct: final[i] === qq.correctIndex,
      difficulty: session.mode === "exam" ? "prov" : "medel",
    }));
    await supabase.from("quiz_attempts").insert(rows);
    const correct = rows.filter((r) => r.correct).length;
    await awardXp(correct * XP.correctAnswer + (rows.length - correct) * XP.wrongAnswer);
  }

  useEffect(() => {
    if (remaining === 0 && !done) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  function pick(i: number) {
    if (done || (instant && picked !== null)) return;
    const next = [...answers];
    next[index] = i;
    setAnswers(next);
  }

  function nextQ() {
    if (index < session.questions.length - 1) setIndex(index + 1);
    else void finish();
  }

  if (done) {
    const correct = session.questions.filter((qq, i) => answers[i] === qq.correctIndex).length;
    const total = session.questions.length;
    const passed = session.mode === "exam" ? correct >= EXAM.passAt : correct / total >= 0.8;
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <div className="tile p-6 text-center">
          <div className={cn("text-6xl font-extrabold", passed ? "text-success" : "text-destructive")}>
            {correct}/{total}
          </div>
          <p className="mt-2 text-lg font-bold">{passed ? "Godkänt! 🎉" : "Inte godkänt än – fortsätt öva!"}</p>
          {session.mode === "exam" && (
            <p className="text-sm text-muted-foreground">Gränsen för godkänt är {EXAM.passAt} rätt av {EXAM.total}.</p>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" onClick={onExit}>Tillbaka</Button>
            <Button onClick={onMore}>Nytt prov</Button>
          </div>
        </div>
        <div className="space-y-3">
          {session.questions.map((qq, i) => {
            const ok = answers[i] === qq.correctIndex;
            return (
              <div key={i} className="tile p-4">
                <div className="flex gap-2">
                  {ok ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <XCircle className="size-5 shrink-0 text-destructive" />}
                  <div className="space-y-1">
                    {qq.signCode && qq.signCode !== "none" && (
                      <img src={signUrl(qq.signCode)} alt="Vägmärke" className="h-16 w-auto" />
                    )}
                    <p className="font-semibold">{qq.question}</p>
                    {!ok && (
                      <p className="text-sm">
                        Rätt svar: <span className="font-semibold">{qq.options[qq.correctIndex]}</span>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">{qq.explanation}</p>
                    <SourceLink q={qq} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const mm = remaining !== null ? Math.floor(remaining / 60000) : 0;
  const ss = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground">Avbryt</button>
        <Progress value={((index + 1) / session.questions.length) * 100} className="h-3 flex-1" />
        <span className="text-sm font-semibold tabular-nums">
          {index + 1}/{session.questions.length}
        </span>
        {remaining !== null && (
          <span className={cn("flex items-center gap-1 text-sm font-bold tabular-nums", remaining < 300000 && "text-destructive")}>
            <Clock className="size-4" /> {mm}:{ss.toString().padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="tile overflow-hidden">
        {q.image && <img src={q.image} alt="Trafiksituation" width={1024} height={640} className="aspect-[16/10] w-full object-cover" />}
        <div className="space-y-4 p-5">
          <span className="rounded-full bg-sign px-2.5 py-0.5 text-xs font-bold text-sign-foreground">{q.category}</span>
          {q.signCode && q.signCode !== "none" && (
            <div className="flex justify-center rounded-xl bg-muted py-5">
              <img src={signUrl(q.signCode)} alt="Vägmärke" className="h-36 w-auto object-contain" />
            </div>
          )}
          <h2 className="text-xl font-bold md:text-2xl">{q.question}</h2>
          <div className="grid gap-2">
            {q.options.map((opt, i) => {
              const show = instant && picked !== null;
              const isRight = i === q.correctIndex;
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  className={cn(
                    "rounded-xl border-2 px-4 py-3 text-left font-medium transition",
                    !show && picked === i && "border-primary bg-secondary",
                    !show && picked !== i && "hover:bg-muted",
                    show && isRight && "border-success bg-success text-success-foreground",
                    show && !isRight && picked === i && "border-destructive bg-destructive text-destructive-foreground",
                    show && !isRight && picked !== i && "opacity-60",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {instant && picked !== null && (
            <div className="rounded-xl bg-muted p-4 text-sm">
              <p className="mb-1 font-bold">{picked === q.correctIndex ? "Rätt! +10 XP" : "Inte riktigt."}</p>
              <p>{q.explanation}</p>
              <SourceLink q={q} />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {!instant && (
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Föregående
          </Button>
        )}
        <Button className="ml-auto" disabled={instant && picked === null} onClick={nextQ}>
          {index === session.questions.length - 1 ? "Lämna in" : "Nästa"}
        </Button>
      </div>
    </div>
  );
}
