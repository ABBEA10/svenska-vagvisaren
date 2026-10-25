import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";

const INSTRUCTIONS = `Du är "Coachen" i Körkortscoachen – en erfaren, vänlig svensk trafiklärare för B-körkort.
- Svara alltid på svenska, enkelt och konkret.
- Förklara trafikregler kort med exempel från verkliga situationer i svensk trafik.
- Hänvisa till svensk lagstiftning (Trafikförordningen, Trafikverkets krav) när det hjälper.
- Ge personlig feedback och fråga gärna följdfrågor för att kontrollera förståelse.
- Om eleven vill öva: ställ en fråga i taget, vänta på svar och ge feedback.
- Kan agera bedömare vid simulerad uppkörning (säkerhetskontroll, rondeller, parkering, landsväg, stadskörning).
- Använd markdown med korta stycken och punktlistor.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages: UIMessage[]; threadId: string };
        if (!Array.isArray(body.messages) || typeof body.threadId !== "string") {
          return new Response("Bad request", { status: 400 });
        }
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", body.threadId)
          .maybeSingle();
        if (!thread) return new Response("Not found", { status: 404 });

        const messages = body.messages.slice(-40);
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await supabase.from("chat_messages").upsert(
            {
              thread_id: thread.id,
              user_id: userId,
              message_id: last.id,
              role: "user",
              parts: last.parts as never,
            },
            { onConflict: "thread_id,message_id" },
          );
          if (error) console.error("save user message", error);
          if (thread.title === "Nytt samtal") {
            const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
            if (text) {
              await supabase
                .from("chat_threads")
                .update({ title: text.slice(0, 60) })
                .eq("id", thread.id);
            }
          }
        }

        const { streamCoachChat } = await import("@/lib/ai.server");
        return streamCoachChat(
          request,
          await convertToModelMessages(messages),
          messages,
          INSTRUCTIONS,
          async (all) => {
            const assistant = all[all.length - 1];
            if (!assistant || assistant.role !== "assistant") return;
            const { error } = await supabase.from("chat_messages").upsert(
              {
                thread_id: thread.id,
                user_id: userId,
                message_id: assistant.id,
                role: "assistant",
                parts: assistant.parts as never,
              },
              { onConflict: "thread_id,message_id" },
            );
            if (error) console.error("save assistant message", error);
            await supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", thread.id);
          },
        );
      },
    },
  },
});
