import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, type ModelMessage, type UIMessage } from "ai";
import type { z } from "zod";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";

const BASE_URL = "https://ai.gateway.lovable.dev/v1";
export const AI_MODEL = "openai/gpt-6-astra";

function getKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI är inte konfigurerat.");
  return key;
}

function makeProvider(apiKey: string, fetchImpl: typeof fetch) {
  return createOpenAI({
    baseURL: BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: fetchImpl,
  });
}

const reasoningOptions = (effort: "low" | "medium") => ({
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: effort,
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
  },
});

export function streamCoachChat(
  request: Request,
  messages: ModelMessage[],
  originalMessages: UIMessage[],
  instructions: string,
  onFinish: (messages: UIMessage[]) => Promise<void>,
) {
  const apiKey = getKey();
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = makeProvider(apiKey, runIdFetch.fetch as typeof fetch);
  const result = streamText({
    model: provider.responses(AI_MODEL),
    instructions,
    messages,
    abortSignal: request.signal,
    providerOptions: reasoningOptions("medium"),
  });
  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages,
      sendReasoning: true,
      onFinish: async ({ messages: all }) => {
        await onFinish(all);
      },
      onError: (error) => friendlyError(error),
    }),
    runIdFetch,
  );
}

export function friendlyError(error: unknown): string {
  const status =
    (error as { statusCode?: number })?.statusCode ??
    (error as { cause?: { statusCode?: number } })?.cause?.statusCode;
  if (status === 429) return "För många förfrågningar just nu. Vänta en stund och försök igen.";
  if (status === 402) return "AI-krediterna är slut. Fyll på krediter för att fortsätta.";
  if (status === 403) return "AI-åtkomst nekades för den här arbetsytan.";
  return "Något gick fel med AI-tjänsten. Försök igen.";
}

/** Streams a structured response and returns the final parsed object. */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  instructions: string,
  prompt: string,
): Promise<T> {
  const apiKey = getKey();
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = makeProvider(apiKey, runIdFetch.fetch as typeof fetch);
  try {
    const result = streamText({
      model: provider.responses(AI_MODEL),
      instructions,
      prompt,
      output: Output.object({ schema }),
      providerOptions: reasoningOptions("low"),
    });
    return (await result.output) as T;
  } catch (error) {
    console.error("AI error", error);
    throw new Error(friendlyError(error));
  }
}
