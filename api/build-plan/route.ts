// api/build-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyseHTML } from "../../lib/modules/analyse_html";
import { generatePrompt } from "../../lib/modules/prompt_generation";
import { generateBlueprint } from "../../lib/modules/build_planner";
import { generateWorkflow } from "../../lib/modules/guided_workflow";
import { supabase } from "../../lib/supabase/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }

    const url = body.url;

    console.log("[BUILD_PLANNER] Starting build pipeline for:", url);

    // 1. Analyse the HTML of the target URL
    const analysis = await analyseHTML(url);

    // 2. Convert analysis into LLM prompt
    const prompt = generatePrompt(analysis);

    // 3. Generate the blueprint via LLM
    const blueprint = await generateBlueprint(prompt);

    // 4. Convert the blueprint into a guided workflow
    const workflow = await generateWorkflow(blueprint);

    // 5. SAVE INTO SUPABASE DATABASE
    const { error: dbError } = await supabase.from("build_plans").insert({
      url,
      analysis,
      prompt,
      blueprint,
      workflow,
    });

    if (dbError) {
      console.error("[SUPABASE] Insert error:", dbError);
      // (Don’t fail the whole API if DB only fails — still return the plan)
    }

    // 6. Return the complete Build Plan
    return NextResponse.json({
      success: true,
      url,
      analysis,
      prompt,
      blueprint,
      workflow,
    });
  } catch (err: any) {
    console.error("[BUILD_PLANNER] ERROR:", err);

    return NextResponse.json(
      {
        error: "Failed to generate build plan",
        detail: err.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

