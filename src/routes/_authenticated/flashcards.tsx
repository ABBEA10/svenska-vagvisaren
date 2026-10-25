import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateFlashcards } from "@/lib/ai.functions";
import { CATEGORIES, scheduleCard, XP, type Rating } from "@/lib/domain";
import { awardXp } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards – Körkortscoachen AI" },
      { name: "description", content: "AI-skapade flashcards med smart repetition." },
      { property: "og:title", content: "Flashcards – Körkortscoachen AI" },
      { property: "og:description", content: "AI-skapade flashcards med smart repetition." },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateFlashcards);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [creating, setCreating] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["flashcards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("flashcards").select("*").order("due_at");
      if (error) throw error;
      return data;
    },
  });
  const cards = data ?? [];
  const due = cards.filter((c) => new Date(c.due_at) <= new Date());
  const card = due[0];

  async function create() {
    setCreating(true);
    try {
      const r = await gen({ data: { category } });
      toast.success(`${r.count} nya kort om ${category}`);
      qc.invalidateQueries({ queryKey: ["flashcards"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setCreating(false);
    }
  }

  async function rate(r: Rating) {
    if (!card) return;
    const next = scheduleCard(card, r, new Date());
    await supabase.from("flashcards").update({ ...next, reviews: card.reviews + 1 }).eq("id", card.id);
    setFlipped(false);
    await awardXp(XP.flashcardReview);
    qc.invalidateQueries({ queryKey: ["flashcards"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-extrabold md:text-4xl">Flashcards</h1>
        <span className="text-sm text-muted-foreground">{due.length} att repetera · {cards.length} totalt</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
      ) : card ? (
        <div className="space-y-4">
          <button
            onClick={() => setFlipped(!flipped)}
            className="tile flex min-h-64 w-full flex-col items-center justify-center p-8 text-center"
          >
            <span className="mb-4 rounded-full bg-sign px-2.5 py-0.5 text-xs font-bold text-sign-foreground">{card.category}</span>
            <p className="text-xl font-bold md:text-2xl">{flipped ? card.back : card.front}</p>
            {!flipped && <p className="mt-6 text-sm text-muted-foreground">Tryck för att vända</p>}
          </button>
          {flipped && (
            <div className="grid grid-cols-3 gap-2">
              <Button variant="destructive" onClick={() => rate("svårt")}>Svårt</Button>
              <Button variant="secondary" onClick={() => rate("medel")}>Medel</Button>
              <Button onClick={() => rate("lätt")}>Lätt</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="tile p-8 text-center">
          <p className="text-lg font-bold">Inga kort att repetera just nu 🎉</p>
          <p className="text-muted-foreground">Skapa nya kort nedan.</p>
        </div>
      )}

      <div className="tile space-y-3 p-5">
        <h2 className="font-bold">Skapa nya kort med AI</h2>
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
        <Button onClick={create} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" /> : <Plus />} Skapa 8 kort
        </Button>
      </div>
    </div>
  );
}
