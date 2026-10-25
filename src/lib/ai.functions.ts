import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SOURCE_KEYS, SOURCES } from "./sources";
import { SIGN_CODES, SIGNS, planSignQuestions } from "./signs";

const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
      sourceKey: z.enum(SOURCE_KEYS),
      sourceRef: z.string(),
      signCode: z.enum(["none", ...SIGN_CODES]),
    }),
  ),
});
export type TheoryQuestion = z.infer<typeof questionSchema>["questions"][number];

const SIGN_GUIDE = Object.entries(SIGNS)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n");

const SOURCE_GUIDE = Object.entries(SOURCES)
  .map(([k, v]) => `- ${k}: ${v.name}`)
  .join("\n");

export const generateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category: string; difficulty: string; count: number }) => ({
    category: String(input.category).slice(0, 60),
    difficulty: String(input.difficulty).slice(0, 20),
    count: Math.min(20, Math.max(1, Math.floor(Number(input.count) || 1))),
  }))
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai.server");
    const signPlan = data.category === "Vägmärken" ? planSignQuestions(data.count) : [];
    const out = await generateStructured(
      questionSchema,
      `Du är en expert på det svenska teoriprovet för B-körkort (Trafikverket). Skriv på korrekt svenska. Frågorna ska följa gällande svensk trafiklagstiftning och vara realistiska, som på riktiga provet. Varje fråga har exakt 4 svarsalternativ med ett korrekt svar. Förklaringen ska vara kort och pedagogisk.
Varje fråga MÅSTE ha en källa. Välj sourceKey bland endast dessa officiella källor:
${SOURCE_GUIDE}
sourceRef ska vara den exakta hänvisningen, t.ex. "3 kap. 18 §" eller vägmärkets beteckning "B1". Skriv bara en paragraf du är säker på; är du osäker, ange kapitlet. Skapa inte frågor som du inte kan belägga med någon av källorna.
Vägmärken med bild: signCode kan vara en av dessa (koden visar en bild av märket för eleven):
${SIGN_GUIDE}
I kategorin "Vägmärken" MÅSTE varje fråga ha en signCode från listan och handla om det märket. Följ den tilldelade frågevinkeln och märkeskoden för varje fråga i beställningen. Anpassa vinkeln till märkets faktiska regel: hitta aldrig på en väjningsregel för ett märke som inte reglerar väjning. Beskriv vid behov vägens förhållanden, färdriktning och andra trafikanter i texten; bilden visar endast ett vägmärke. Hitta inte på tilläggstavlor eller andra detaljer i bilden. Skriv INTE märkets namn i frågetexten, eleven ser bilden. Variera frågeformuleringar och använd realistiska felsvar. På medel och svår nivå ska situationerna kräva att eleven tillämpar regeln, inte bara känner igen symbolen. I andra kategorier: använd signCode när en bild hjälper, annars "none".`,
      `Skapa ${data.count} unika flervalsfrågor i kategorin "${data.category}" med svårighetsgrad "${data.difficulty}". Variera korrekt svarsposition (correctIndex 0-3). Slumpfrö: ${Math.random().toString(36).slice(2)}${signPlan.length ? `\nFrågeplan (följ ordningen):\n${signPlan.map((item, i) => `${i + 1}. signCode=${item.signCode}. ${item.angle}`).join("\n")}` : ""}`,
    );
    return out.questions
      .filter((q) => q.options.length >= 2 && q.correctIndex >= 0 && q.correctIndex < q.options.length)
      .slice(0, data.count);
  });

const cardSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category: string }) => ({ category: String(input.category).slice(0, 60) }))
  .handler(async ({ data, context }) => {
    const { generateStructured } = await import("./ai.server");
    const out = await generateStructured(
      cardSchema,
      "Du skapar flashcards för svenska B-körkortets teoriprov. Framsidan är en kort fråga eller begrepp, baksidan ett kort och korrekt svar (max 2 meningar). Skriv på svenska.",
      `Skapa 8 flashcards om "${data.category}". Slumpfrö: ${Math.random().toString(36).slice(2)}`,
    );
    const rows = out.cards.slice(0, 12).map((c) => ({
      user_id: context.userId,
      category: data.category,
      front: c.front,
      back: c.back,
    }));
    const { error } = await context.supabase.from("flashcards").insert(rows);
    if (error) throw new Error("Kunde inte spara korten.");
    return { count: rows.length };
  });

const tipSchema = z.object({ title: z.string(), tip: z.string() });

export const dailyTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { weakest: string | null }) => ({
    weakest: input.weakest ? String(input.weakest).slice(0, 60) : null,
  }))
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai.server");
    return generateStructured(
      tipSchema,
      "Du är en peppig men saklig svensk trafiklärare. Ge ett konkret dagligt tips (max 3 meningar) för att klara teoriprov och uppkörning för B-körkort.",
      data.weakest
        ? `Eleven är svagast inom "${data.weakest}". Ge ett tips om det.`
        : "Ge ett allmänt tips för dagen.",
    );
  });

const planSchema = z.object({
  weeks: z.array(
    z.object({
      focus: z.string(),
      days: z.array(
        z.object({
          title: z.string(),
          type: z.enum(["teori", "flashcards", "korning", "coach", "prov", "vila"]),
          category: z.string(),
        }),
      ),
    }),
  ),
});
export type StudyPlan = z.infer<typeof planSchema>;

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { weak: string[]; strong: string[]; theoryDays: number | null; drivingDays: number | null; drivingHours: number }) => ({
    weak: input.weak.slice(0, 9).map((s) => String(s).slice(0, 40)),
    strong: input.strong.slice(0, 9).map((s) => String(s).slice(0, 40)),
    theoryDays: input.theoryDays == null ? null : Number(input.theoryDays),
    drivingDays: input.drivingDays == null ? null : Number(input.drivingDays),
    drivingHours: Number(input.drivingHours) || 0,
  }))
  .handler(async ({ data, context }) => {
    const { generateStructured } = await import("./ai.server");
    const plan = await generateStructured(
      planSchema,
      `Du är en svensk trafiklärare som gör personliga 8-veckorsscheman för B-körkort. Exakt 8 veckor, varje vecka exakt 7 dagar (måndag–söndag). Varje dag har en konkret uppgift (max 8 ord i title).
type: teori (teorifrågor i en kategori), flashcards, korning (övningskörning med ett moment), coach (fråga AI-coachen), prov (fullt simulerat Trafikverksprov), vila.
category: en av Vägmärken, Väjningsregler, Trafiksäkerhet, Miljö, Fordonskunskap, Motorväg, Landsväg, Stadskörning, Mörkerkörning – eller ett körmoment för korning (t.ex. Rondeller, Parkering). Tom sträng för vila/prov.
Ha 1 vilodag per vecka, fler prov mot slutet, och lägg mer tid på svaga områden. focus är veckans tema (max 5 ord).`,
      `Svaga områden: ${data.weak.join(", ") || "okänt"}. Starka: ${data.strong.join(", ") || "okänt"}. Dagar till teoriprov: ${data.theoryDays ?? "ej satt"}. Dagar till uppkörning: ${data.drivingDays ?? "ej satt"}. Loggade körtimmar: ${data.drivingHours}.`,
    );
    const { data: row, error } = await context.supabase
      .from("study_plans")
      .insert({ user_id: context.userId, plan: plan as never })
      .select("id")
      .single();
    if (error) throw new Error("Kunde inte spara schemat.");
    return { id: row.id };
  });

const analysisSchema = z.object({
  summary: z.string(),
  problems: z.array(z.object({ area: z.string(), why: z.string(), action: z.string() })),
  exercises: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
      category: z.string(),
      sourceKey: z.enum(SOURCE_KEYS),
      sourceRef: z.string(),
    }),
  ),
});
export type Analysis = z.infer<typeof analysisSchema>;

export const analyzeWeaknesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: attempts } = await context.supabase
      .from("quiz_attempts")
      .select("category, question, correct")
      .order("created_at", { ascending: false })
      .limit(300);
    const { data: sessions } = await context.supabase
      .from("driving_sessions")
      .select("skills, rating, notes")
      .order("session_date", { ascending: false })
      .limit(30);
    const wrong = (attempts ?? []).filter((a) => !a.correct).slice(0, 40).map((a) => `[${a.category}] ${a.question}`);
    const stats: Record<string, { t: number; c: number }> = {};
    for (const a of attempts ?? []) {
      stats[a.category] ??= { t: 0, c: 0 };
      stats[a.category]!.t++;
      if (a.correct) stats[a.category]!.c++;
    }
    const statText = Object.entries(stats).map(([k, v]) => `${k}: ${v.c}/${v.t}`).join("; ");
    const driveText = (sessions ?? []).map((s) => `${s.skills.join("/")} betyg ${s.rating}${s.notes ? ` (${s.notes.slice(0, 80)})` : ""}`).join("; ");
    const { generateStructured } = await import("./ai.server");
    return generateStructured(
      analysisSchema,
      `Du är en svensk trafiklärare som analyserar en elevs resultat inför B-körkort. Svara på svenska.
summary: 2–3 meningar. problems: 2–4 problemområden med varför och en konkret åtgärd. exercises: 5 extra flervalsfrågor (exakt 4 alternativ) riktade mot elevens fel.
Varje övning MÅSTE ha källa. Tillåtna sourceKey:
${SOURCE_GUIDE}
sourceRef = exakt paragraf eller vägmärkesbeteckning; är du osäker, ange kapitlet.`,
      `Resultat per kategori: ${statText || "inga ännu"}.\nSenaste felsvar:\n${wrong.join("\n") || "inga"}\nKörlogg: ${driveText || "inga körningar"}`,
    );
  });
