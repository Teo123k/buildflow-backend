import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { flow_id } = await request.json();

    if (!flow_id) {
      return Response.json(
        { error: "flow_id is required" },
        { status: 400 }
      );
    }

    // Load flow
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("*")
      .eq("id", flow_id)
      .single();

    if (flowError || !flow) {
      console.error("Error loading flow:", flowError);
      return Response.json({ error: "Flow not found" }, { status: 404 });
    }

    // Load steps
    const { data: steps, error: stepsError } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", flow_id)
      .order("step_number", { ascending: true });

    if (stepsError) {
      console.error("Error loading steps:", stepsError);
      return Response.json({ error: "Could not load steps" }, { status: 500 });
    }

    let context = {}; // shared memory between steps
    let logs = [];

    for (const step of steps) {
      const { type, config } = step;

      logs.push({ step: step.step_number, type });

      // --------------------------
      // AGENT TYPE: OPENAI
      // --------------------------
      if (type === "openai") {
        const prompt = config.prompt.replace("{{context}}", JSON.stringify(context));

        const response = await openai.chat.completions.create({
          model: config.model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        });

        const output = response.choices[0].message.content;

        context[`step_${step.step_number}`] = output;
        logs.push({ step: step.step_number, output });

      }

      // --------------------------
      // AGENT TYPE: HTTP REQUEST
      // --------------------------
      else if (type === "http_request") {
        const res = await fetch(config.url, {
          method: config.method || "GET",
          headers: config.headers || {},
          body: config.body ? JSON.stringify(config.body) : undefined
        });

        const output = await res.json().catch(() => null);

        context[`step_${step.step_number}`] = output;
        logs.push({ step: step.step_number, output });
      }

      // --------------------------
      // AGENT TYPE: CUSTOM TRANSFORM
      // --------------------------
      else if (type === "transform") {
        // user-defined JS function in config.transform
        const fn = new Function("context", config.transform);
        const output = fn(context);

        context[`step_${step.step_number}`] = output;
        logs.push({ step: step.step_number, output });
      }

      // More agent types can be added here...
    }

    // Save execution log
    const { data: execution, error: execError } = await supabase
      .from("executions")
      .insert([
        {
          flow_id,
          status: "completed",
          output: context
        }
      ])
      .select()
      .single();

    if (execError) console.error("Execution log save error:", execError);

    return Response.json({
      success: true,
      flow_id,
      output: context,
      logs
    });

  } catch (err) {
    console.error("Execution engine error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

