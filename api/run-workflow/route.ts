// api/run-workflow/route.ts

import { supabase } from "../../lib/supabaseClient";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { planId } = body || {};

    if (!planId) {
      return Response.json(
        { success: false, error: "Missing planId" },
        { status: 400 }
      );
    }

    // 1. Load plan from Supabase
    const { data: plan, error } = await supabase
      .from("build_plans")
      .select("workflow")
      .eq("id", planId)
      .single();

    if (error || !plan || !plan.workflow) {
      return Response.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = plan.workflow;
    const steps =
      workflow.build_steps ||
      workflow.steps ||
      [];

    const outputs: Array<{ stepId: number; result: string | null }> = [];

    // 2. Execute steps in order
    for (const step of steps) {
      const prompt =
        step.replit_prompt ||
        step.prompt ||
        "";

      if (!prompt) {
        outputs.push({
          stepId: step.id,
          result: null,
        });
        continue;
      }

      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a workflow execution agent. Execute this step of a build plan.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const result = completion.choices[0]?.message?.content ?? null;

      outputs.push({
        stepId: step.id,
        result,
      });
    }

    return Response.json(
      {
        success: true,
        results: outputs,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[RUN_WORKFLOW] Error:", err);
    return Response.json(
      {
        success: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

