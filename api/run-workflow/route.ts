import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase/client";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Missing planId" },
        { status: 400 }
      );
    }

    // 1. Load plan from DB
    const { data: plan, error } = await supabase
      .from("build_plans")
      .select("workflow")
      .eq("id", planId)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = plan.workflow;
    const steps = workflow?.steps || [];

    const outputs: any[] = [];

    // 2. Execute steps in order
    for (const step of steps) {
      const prompt = step.prompt;

      const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are a workflow execution agent." },
          { role: "user", content: prompt },
        ],
      });

      const result = completion.choices[0].message.content;

      outputs.push({
        stepId: step.id,
        result,
      });
    }

    return NextResponse.json(
      {
        success: true,
        results: outputs,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

