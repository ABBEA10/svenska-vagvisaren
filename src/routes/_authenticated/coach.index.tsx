import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useCreateThread } from "./coach";

export const Route = createFileRoute("/_authenticated/coach/")({
  component: CoachEmpty,
});

function CoachEmpty() {
  const create = useCreateThread();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <img src={logo} alt="" width={96} height={96} className="size-24" />
      <h1 className="text-3xl font-extrabold">Din AI-trafiklärare</h1>
      <p className="max-w-md text-muted-foreground">Fråga om regler, be om förklaringar eller låt coachen simulera en uppkörning.</p>
      <Button size="lg" onClick={create}>Starta ett samtal</Button>
    </div>
  );
}
