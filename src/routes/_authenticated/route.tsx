import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3, BookOpenCheck, CalendarRange, Car, ClipboardCheck, Layers, LayoutDashboard, LogOut, Menu, MessageCircle, Moon, Sun, Target } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Översikt", icon: LayoutDashboard },
  { to: "/coach", label: "AI Coach", icon: MessageCircle },
  { to: "/teori", label: "Teoriprov", icon: BookOpenCheck },
  { to: "/uppkorning", label: "Uppkörning", icon: ClipboardCheck },
  { to: "/schema", label: "Schema", icon: CalendarRange },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/korlogg", label: "Körlogg", icon: Car },
  { to: "/analys", label: "Svaghetsanalys", icon: Target },
  { to: "/statistik", label: "Statistik", icon: BarChart3 },
] as const;
const MOBILE = NAV.slice(0, 4);

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      aria-label="Byt tema"
      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r-2 bg-sidebar p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <img src={logo} alt="" width={36} height={36} className="size-9" />
          <span className="font-display text-lg font-extrabold leading-tight">Körkorts&shy;coachen</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-sidebar-foreground/75 transition hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground border-2 border-sidebar-border" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button onClick={signOut} className="flex items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted">
            <LogOut className="size-4" /> Logga ut
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b-2 px-4 py-3 md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="" width={28} height={28} className="size-7" />
          <span className="font-display font-extrabold">Körkortscoachen</span>
        </Link>
        <div className="flex items-center">
          <ThemeToggle />
          <button onClick={signOut} aria-label="Logga ut" className="rounded-lg p-2 text-muted-foreground">
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t-2 bg-card md:hidden">
        {MOBILE.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground">
            <Menu className="size-5" />
            Mer
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader><SheetTitle>Mer</SheetTitle></SheetHeader>
            <div className="grid grid-cols-3 gap-2 p-4">
              {NAV.slice(4).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="tile flex flex-col items-center gap-1 p-3 text-xs font-semibold">
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
