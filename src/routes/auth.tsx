import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logga in – Körkortscoachen AI" },
      { name: "description", content: "Logga in eller skapa konto för att spara dina framsteg." },
      { property: "og:title", content: "Logga in – Körkortscoachen AI" },
      { property: "og:description", content: "Logga in eller skapa konto för att spara dina framsteg." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name } },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <img src={logo} alt="" width={40} height={40} className="size-10" />
        <span className="font-display text-xl font-extrabold">Körkortscoachen</span>
      </Link>
      <div className="tile w-full max-w-sm p-6">
        {sent ? (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-extrabold">Kolla din e-post</h1>
            <p className="text-muted-foreground">
              Vi har skickat en bekräftelselänk till {email}. Klicka på den för att komma igång.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-2xl font-extrabold">{mode === "in" ? "Välkommen tillbaka" : "Skapa konto"}</h1>
            {mode === "up" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Namn</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Lösenord</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {mode === "in" ? "Logga in" : "Skapa konto"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Inget konto? Skapa ett" : "Har du redan konto? Logga in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
