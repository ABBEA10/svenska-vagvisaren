import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/uppkorning")({
  head: () => ({
    meta: [
      { title: "Uppkörningstränare – Körkortscoachen AI" },
      { name: "description", content: "Simulera en riktig uppkörning med en AI-trafikinspektör." },
      { property: "og:title", content: "Uppkörningstränare – Körkortscoachen AI" },
      { property: "og:description", content: "Simulera en riktig uppkörning med en AI-trafikinspektör." },
    ],
  }),
  component: DrivingTestPage,
});

const MOMENTS = ["Säkerhetskontroll", "Stadskörning", "Rondeller", "Parkering", "Landsväg", "Motorväg", "Mörkerkörning"];

function DrivingTestPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>(["Säkerhetskontroll", "Stadskörning", "Rondeller", "Parkering", "Landsväg"]);
  const [busy, setBusy] = useState(false);

  const { data: past } = useQuery({
    queryKey: ["driving-tests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_threads")
        .select("id, title, created_at")
        .eq("kind", "driving_test")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  async function start() {
    if (!selected.length) {
      toast.error("Välj minst ett moment");
      return;
    }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: u.user!.id, kind: "driving_test", title: `Uppkörning: ${selected.join(", ")}` })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error("Kunde inte starta");
      return;
    }
    qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/coach/$threadId", params: { threadId: data.id } });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold md:text-4xl">Uppkörningstränare</h1>
        <p className="mt-1 text-muted-foreground">
          En AI-trafikinspektör beskriver situationer en i taget. Du svarar med vad du gör och får bedömning och feedback på slutet.
        </p>
      </div>
      <div className="tile space-y-4 p-5">
        <div className="text-sm font-semibold">Välj moment</div>
        <div className="flex flex-wrap gap-2">
          {MOMENTS.map((m) => (
            <button
              key={m}
              onClick={() => setSelected(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m])}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm font-medium",
                selected.includes(m) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Button size="lg" className="w-full shadow-pop" onClick={start} disabled={busy}>
          <ClipboardCheck /> Starta uppkörning
        </Button>
      </div>
      {!!past?.length && (
        <div className="space-y-2">
          <h2 className="font-bold">Tidigare uppkörningar</h2>
          {past.map((t) => (
            <Link key={t.id} to="/coach/$threadId" params={{ threadId: t.id }} className="tile block p-3 text-sm hover:border-primary">
              <div className="font-semibold">{t.title}</div>
              <div className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString("sv-SE")}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
