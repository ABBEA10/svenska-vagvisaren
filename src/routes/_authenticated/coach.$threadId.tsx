import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/coach/$threadId")({
  component: ThreadPage,
});

const STARTERS = [
  "Förklara högerregeln enkelt",
  "Simulera en uppkörning med mig",
  "Vad kontrolleras i säkerhetskontrollen?",
  "Hur kör jag i en flerfilig rondell?",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("message_id, role, parts")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return data.map((m) => ({ id: m.message_id, role: m.role, parts: m.parts }) as unknown as UIMessage);
    },
  });
  const { data: thread } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const { data } = await supabase.from("chat_threads").select("kind, title").eq("id", threadId).maybeSingle();
      return data;
    },
  });
  if (isLoading || !data || !thread) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  return <ChatWindow key={threadId} threadId={threadId} initial={data} kind={thread.kind} title={thread.title} />;
}

function ChatWindow({ threadId, initial, kind, title }: { threadId: string; initial: UIMessage[]; kind: string; title: string }) {
  const qc = useQueryClient();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
        },
      }),
    [threadId],
  );
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Något gick fel"),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["thread-messages", threadId] });
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const started = useRef(false);
  useEffect(() => {
    if (kind !== "driving_test" || initial.length > 0 || started.current) return;
    // Delay so StrictMode's mount/unmount cycle doesn't swallow the first send.
    const t = setTimeout(() => {
      started.current = true;
      sendMessage({ text: `Jag är redo. Starta den simulerade uppkörningen. ${title.replace("Uppkörning: ", "Moment: ")}` });
    }, 300);
    return () => clearTimeout(t);
  }, [kind, initial.length, title, sendMessage]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-2 px-4 py-2 md:hidden">
        <Link to="/coach" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Samtal</Link>
      </div>
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 && kind !== "driving_test" && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <img src={logo} alt="" width={72} height={72} className="size-18" />
              <h2 className="text-2xl font-extrabold">Vad vill du öva på?</h2>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => sendMessage({ text: s })} className="tile p-3 text-left text-sm font-medium hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer>Coachen tänker…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-3">
        <PromptInput
          onSubmit={(msg) => {
            if (!msg.text.trim() || busy) return;
            sendMessage({ text: msg.text });
          }}
        >
          <PromptInputTextarea placeholder="Fråga din trafiklärare…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
