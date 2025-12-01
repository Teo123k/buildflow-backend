// lib/modules/build_planner.ts

type BuildPlannerBlueprint = any;

export interface BuildPlannerResult {
  success: boolean;
  error?: string;
  blueprint: BuildPlannerBlueprint | null;
  raw?: any;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

async function safeJsonAi(options: {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  cacheKey?: string; // not used yet, placeholder to match Python concept
  defaultResponse?: any;
}): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("[BUILD_PLANNER] Missing OPENAI_API_KEY");
    return options.defaultResponse ?? { error: "Missing OPENAI_API_KEY" };
  }

  const model = options.model || DEFAULT_MODEL;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a senior full-stack engineer and product architect. You produce ONLY valid JSON. No markdown, no commentary.",
          },
          {
            role: "user",
            content: options.prompt,
          },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1200,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[BUILD_PLANNER] OpenAI HTTP error:", res.status, text);
      return options.defaultResponse ?? {
        error: `OpenAI HTTP ${res.status}`,
        raw: text,
      };
    }

    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      JSON.stringify(options.defaultResponse ?? {});

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("[BUILD_PLANNER] JSON parse error:", e);
      return options.defaultResponse ?? {
        error: "Failed to parse AI JSON response",
        raw: content.slice(0, 500),
      };
    }

    return parsed;
  } catch (err: any) {
    console.error("[BUILD_PLANNER] OpenAI call failed:", err);
    return options.defaultResponse ?? {
      error: "OpenAI request failed",
      raw: String(err).slice(0, 500),
    };
  }
}

export async function generateBlueprint(
  idea: string
): Promise<BuildPlannerResult> {
  console.log("[BUILD_PLANNER] Generating blueprint for:", idea.slice(0, 80));

  if (!idea || !idea.trim()) {
    return {
      success: false,
      error: "Please tell me what app you want to build!",
      blueprint: null,
    };
  }

  const prompt = `
You are a senior full-stack engineer who explains things so a 12-year-old can follow.

The user wants to build:
"${idea}"

Create a COMPLETE build plan for the ENTIRE system.

CRITICAL RULES:
1. Cover ALL features mentioned in the idea - don't stop after login/homepage.
2. Plan until a working MVP of the WHOLE system is possible.
3. For complex systems (AI agents, multi-user, dashboards), you MUST include ALL components.
4. Each step modifies only 1–2 files.
5. Each step does ONE thing only.
6. Use simple words a 12-year-old can understand, but keep the engineering professional.
7. Keep "replit_prompt" under 50 words.
8. Aim for 25–40 solid steps that cover the whole system.
9. ALWAYS respond with valid JSON only. No markdown, no commentary.

Return JSON in this exact shape:

{
  "summary": "Short one-sentence summary of the app",
  "stack": {
    "frontend": ["React", "Next.js", "TailwindCSS"],
    "backend": ["Node.js", "Vercel Functions"],
    "database": ["Supabase"],
    "ai": ["OpenAI"],
    "other": ["Stripe", "Auth", "Storage"]
  },
  "phases": [
    {
      "name": "Phase 1 – Setup & Skeleton",
      "goal": "What this phase achieves in 1 short sentence",
      "steps": [
        {
          "id": 1,
          "title": "Step title",
          "description": "Explain like I'm 12 what we are building in this step.",
          "category": "frontend | backend | database | ai | infra | copy",
          "difficulty": "easy | medium | hard",
          "estimated_minutes": 20,
          "replit_prompt": "Very short instruction you would paste into an AI pair-programmer.",
          "notes": ["short extra note 1", "short extra note 2"]
        }
      ]
    }
  ]
}
`.trim();

  const defaultResponse = {
    summary: "Plan unavailable",
    stack: {},
    phases: [],
  };

  const result = await safeJsonAi({
    prompt,
    model: DEFAULT_MODEL,
    temperature: 0.25,
    maxTokens: 1600,
    defaultResponse,
  });

  if (result && result.error && !result.phases) {
    return {
      success: false,
      error: String(result.error),
      blueprint: null,
      raw: result,
    };
  }

  return {
    success: true,
    blueprint: result,
    raw: result,
  };
}

export function generateFixPrompt(
  errorMessage: string,
  context?: string
): string {
  const errorShort = errorMessage.slice(0, 400);
  const ctx = context ? context.slice(0, 150) : "";

  return [
    "Fix this error in the smallest, safest way:",
    "",
    errorShort,
    "",
    ctx ? `Context: ${ctx}` : "",
    "",
    "Rules:",
    "- Smallest fix only",
    "- Don't change other things",
    "- Explain in 1 sentence what you fixed",
  ]
    .filter(Boolean)
    .join("\n");
}

