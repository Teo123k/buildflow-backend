import { supabase } from "../../lib/supabaseClient.js";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { planId } = await req.json();

    if (!planId) {
      return Response.json(
        { success: false, error: "Missing planId" },
        { status: 400 }
      );
    }

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

    const steps = plan.workflow.build_steps || [];

    const outputs = [];

    for (const step of steps) {
      const prompt = step.replit_prompt || step.prompt || "";

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
          { role: "system", content: "Execute this workflow step." },
          { role: "user", content: prompt },
        ],
      });

      const result = completion.choices[0]?.message?.content ?? null;

      outputs.push({
        stepId: step.id,
        result,
      });
    }

    return Response.json(
      { success: true, results: outputs },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

