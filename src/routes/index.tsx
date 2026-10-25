import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, Car, Layers, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Körkortscoachen AI – klara körkortet på första försöket" },
      {
        name: "description",
        content: "AI-coach, obegränsade teorifrågor, flashcards och körlogg för svenska B-körkortet.",
      },
      { property: "og:title", content: "Körkortscoachen AI" },
      {
        property: "og:description",
        content: "AI-coach, obegränsade teorifrågor, flashcards och körlogg för svenska B-körkortet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: MessageCircle, title: "AI Coach", text: "Fråga din personliga trafiklärare vad som helst, dygnet runt." },
  { icon: BookOpenCheck, title: "Obegränsat teoriprov", text: "Nya frågor varje gång, i nio kategorier och tre svårighetsgrader." },
  { icon: Layers, title: "Smarta flashcards", text: "Repetition som anpassar sig efter vad du kan och inte kan." },
  { icon: Car, title: "Körlogg", text: "Logga övningskörningar och se din utveckling inför uppkörningen." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={36} height={36} className="size-9" />
          <span className="font-display text-lg font-extrabold">Körkortscoachen</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Logga in</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.2fr_1fr] md:pt-16">
        <div>
          <p className="mb-4 inline-block rounded-full bg-sign px-3 py-1 text-sm font-bold text-sign-foreground">
            B-körkort · på svenska
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.02] md:text-7xl">
            Klara körkortet på <span className="text-primary">första försöket.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Din AI-trafiklärare för både teoriprovet och uppkörningen. Öva lite varje dag – vi håller koll på resten.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-7 text-base shadow-pop">
              <Link to="/auth">Kom igång gratis</Link>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <img src={logo} alt="Varningsmärke med ratt" width={816} height={816} className="w-full drop-shadow-xl" />
        </div>
      </section>

      <div className="road-stripes h-2 w-full opacity-80" />

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="tile p-5">
            <div className="mb-3 inline-flex rounded-xl bg-sign p-2.5 text-sign-foreground">
              <Icon className="size-5" />
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
