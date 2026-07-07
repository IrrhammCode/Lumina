export type TavilyResult = {
  answer: string;
  sources: { title: string; url: string }[];
};

type TavilyResponse = {
  answer?: string;
  results?: Array<{ title: string; url: string; content?: string }>;
};

export function hasTavilyConfig(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export async function searchCareCompass(
  query: string,
  familyContext?: string
): Promise<TavilyResult | null> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return null;

  const enriched = [
    "Diaspora caregiver using Lumina app with Magic embedded invisible wallet.",
    "Consumer fintech UX — no crypto jargon, focus on care amounts and family needs.",
    familyContext ? `Family: ${familyContext}.` : "",
    `Question: ${query}`,
    "Give practical advice with specific USD amount suggestions ($15, $20, $50). Under 100 words.",
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: enriched,
      search_depth: "advanced",
      max_results: 5,
      include_answer: "advanced",
      topic: "general",
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as TavilyResponse;
  const answer = data.answer?.trim();
  if (!answer) return null;

  return {
    answer,
    sources: (data.results ?? []).slice(0, 3).map((r) => ({
      title: r.title,
      url: r.url,
    })),
  };
}

/** Curated fallback when Tavily key is not configured. */
export function fallbackCareCompass(
  query: string,
  familyContext?: string
): TavilyResult {
  const q = query.toLowerCase();
  const family = familyContext ? ` for ${familyContext.split(",")[0]?.trim()}` : "";

  if (q.includes("pulsa") || q.includes("phone") || q.includes("data")) {
    return {
      answer: `Monthly pulsa${family} typically runs $15–$25 USD. Set autopilot at $20 on the 1st — family gets a push when it lands. Your Magic wallet signs each send invisibly.`,
      sources: [],
    };
  }
  if (q.includes("school") || q.includes("tuition") || q.includes("fee")) {
    return {
      answer: `School fees vary by term; diaspora families often budget $80–$200 USD per payment. Ask family to attach the bill in Lumina — you approve once, Magic wallet signs, they see proof in ~10 seconds.`,
      sources: [],
    };
  }
  if (q.includes("medicine") || q.includes("health") || q.includes("doctor")) {
    return {
      answer: `Unexpected health costs are the #1 pull request for caregivers. Keep $50–$100 ready; when mom asks, tap approve — no MetaMask, just Face ID and your embedded wallet signs.`,
      sources: [],
    };
  }
  if (q.includes("budget") || q.includes("how much")) {
    return {
      answer: `A solid starter plan: $20 pulsa, $80 school, $50 emergency buffer — about $150/month. Lumina autopilot handles the routine; you only tap when family asks for extras.`,
      sources: [],
    };
  }

  return {
    answer: `Start with three buckets: recurring care (pulsa, bills), planned (school), and surprise (medicine). Lumina lets family pull when they need help — you approve with one tap and your Magic wallet signs behind the scenes.`,
    sources: [],
  };
}

/** Extract suggested USD amounts from an AI answer. */
export function extractSuggestedAmounts(text: string): number[] {
  const matches = text.matchAll(/\$(\d+(?:\.\d{1,2})?)/g);
  const amounts = [...matches].map((m) => parseFloat(m[1])).filter((n) => n > 0 && n <= 500);
  return [...new Set(amounts)].slice(0, 3);
}