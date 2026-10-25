import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach – Körkortscoachen AI" },
      { name: "description", content: "Chatta med din AI-trafiklärare om teori och körning." },
      { property: "og:title", content: "AI Coach – Körkortscoachen AI" },
      { property: "og:description", content: "Chatta med din AI-trafiklärare om teori och körning." },
    ],
  }),
  component: CoachLayout,
});

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_threads").select("id, title, updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateThread() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("chat_threads").insert({ user_id: u.user!.id }).select("id").single();
    if (error) return;
    await qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/coach/$threadId", params: { threadId: data.id } });
  };
}

function CoachLayout() {
  const { data: threads } = useThreads();
  const create = useCreateThread();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };

  async function remove(id: string) {
    await supabase.from("chat_threads").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/coach" });
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] md:h-screen">
      <aside className={cn("w-full shrink-0 flex-col border-r-2 p-3 md:flex md:w-64", params.threadId ? "hidden" : "flex")}>
        <Button onClick={create} className="mb-3 w-full"><Plus /> Nytt samtal</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads?.map((t) => (
            <div key={t.id} className={cn("group flex items-center rounded-lg", params.threadId === t.id ? "bg-muted" : "hover:bg-muted/60")}>
              <Link to="/coach/$threadId" params={{ threadId: t.id }} className="flex-1 truncate px-3 py-2 text-sm font-medium">
                {t.title}
              </Link>
              <button onClick={() => remove(t.id)} aria-label="Ta bort samtal" className="px-2 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      <div className={cn("min-w-0 flex-1", !params.threadId && "hidden md:block")}>
        <Outlet />
      </div>
    </div>
  );
}
