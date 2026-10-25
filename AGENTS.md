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
- Road-sign pictures are local files in `public/signs` listed in `src/lib/signs.ts`; AI may only reference those codes. Why: the picture always matches the sign name.
- Road-sign question batches receive a shuffled sign selection and rotating question angles from `planSignQuestions` before AI generation. Why: recognition-only prompts produce repetitive exercises.
- Chat threads have a `kind` (`coach` | `driving_test`); the chat route picks the system prompt from it. Why: one chat pipeline serves both coach and driving test simulation.
