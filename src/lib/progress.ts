import { supabase } from "@/integrations/supabase/client";
import { nextStreak } from "./domain";

/** Adds XP and updates the daily streak for the signed-in user. */
export async function awardXp(amount: number) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data: p } = await supabase
    .from("profiles")
    .select("xp, streak, last_active")
    .eq("id", u.user.id)
    .maybeSingle();
  if (!p) return;
  const today = new Date();
  await supabase
    .from("profiles")
    .update({
      xp: p.xp + amount,
      streak: nextStreak(p.last_active, p.streak, today),
      last_active: today.toISOString().slice(0, 10),
    })
    .eq("id", u.user.id);
}
