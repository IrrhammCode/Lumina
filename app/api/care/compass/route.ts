import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireSession, isSession } from "@/lib/server/api-utils";
import {
  searchCareCompass,
  fallbackCareCompass,
  extractSuggestedAmounts,
  hasTavilyConfig,
} from "@/lib/server/tavily";

type Body = {
  query?: string;
  familyContext?: string;
};

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<Body>(request);
  const query = body?.query?.trim();
  if (!query || query.length < 3) return jsonError("Ask a care question (at least 3 characters)");
  if (query.length > 280) return jsonError("Question is too long");

  const familyContext = body?.familyContext?.trim();

  const tavily = await searchCareCompass(query, familyContext);
  const result = tavily ?? fallbackCareCompass(query, familyContext);

  return jsonOk({
    answer: result.answer,
    sources: result.sources,
    suggestedAmounts: extractSuggestedAmounts(result.answer),
    poweredBy: tavily ? ("tavily" as const) : ("curated" as const),
    tavilyConfigured: hasTavilyConfig(),
  });
}