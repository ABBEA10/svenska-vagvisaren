<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Körkortscoachen
- AI calls live in `src/lib/ai.server.ts` (Responses API via gateway, streamed); server fns in `src/lib/ai.functions.ts`; coach chat streams from `src/routes/api/chat.ts` which verifies the bearer token and thread ownership. Why: keeps keys server-side and RLS enforced.
- Question sources are restricted to the whitelist in `src/lib/sources.ts`; AI picks a key, never a URL. Why: links must always point to real official sources.
- Pure rules (XP, levels, streak, spaced repetition, countdown) live in `src/lib/domain.ts` with tests in `src/test/domain.test.ts`. Why: testable business rules.
