// api/build-plan.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateBlueprint } from "../lib/modules/build_planner";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed. Use POST." });
  }

  const body = (req.body || {}) as { idea?: string };

  const idea = typeof body.idea === "string" ? body.idea : "";

  if (!idea.trim()) {
    return res.status(400).json({
      success: false,
      error: "Missing 'idea' in request body",
      blueprint: null,
    });
  }

  try {
    const result = await generateBlueprint(idea);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[API /build-plan] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: "Build plan generation failed unexpectedly",
      details: String(err).slice(0, 200),
    });
  }
}

