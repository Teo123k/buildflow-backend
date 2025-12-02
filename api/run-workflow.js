// api/run-workflow/route.js
import { supabase } from "../../lib/supabaseClient.js";
import OpenAI from "openai";

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const planId = body?.planId;

    if (!planId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing planId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Load plan from Supabase
    const { data: plan, error } = await supabase
      .from("build_plans")
      .select("workflow")
      .eq("id", planId)
      .single();

    if (error || !plan || !plan.workflow) {
      return new Response(
        JSON.stringify({ success: false, error: "Workflow not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const steps = plan.workflow.build_steps || [];
    const outputs = [];

    // Run steps sequentially
    for (const step of steps) {
      const prompt =
        step.replit_prompt ||
        step.prompt ||
        "";

      if (!prompt) {
        outputs.push({ stepId: step.id, result: null });
        continue;
      }

      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a workflow execution agent.",
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

    return new Response(
      JSON.stringify({ success: true, results: outputs }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
