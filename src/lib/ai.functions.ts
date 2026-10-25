import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
    }),
  ),
});
export type TheoryQuestion = z.infer<typeof questionSchema>["questions"][number];

export const generateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category: string; difficulty: string; count: number }) => ({
    category: String(input.category).slice(0, 60),
    difficulty: String(input.difficulty).slice(0, 20),
    count: Math.min(20, Math.max(1, Math.floor(Number(input.count) || 1))),
  }))
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai.server");
    const out = await generateStructured(
      questionSchema,
      "Du är en expert på det svenska teoriprovet för B-körkort (Trafikverket). Skriv på korrekt svenska. Frågorna ska följa svensk trafiklagstiftning och vara realistiska, som på riktiga provet. Varje fråga har exakt 4 svarsalternativ med ett korrekt svar. Förklaringen ska vara kort, pedagogisk och nämna regeln.",
      `Skapa ${data.count} unika flervalsfrågor i kategorin "${data.category}" med svårighetsgrad "${data.difficulty}". Variera korrekt svarsposition (correctIndex 0-3). Slumpfrö: ${Math.random().toString(36).slice(2)}`,
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
