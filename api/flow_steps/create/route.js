import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { flow_id, step_number, type, config } = await request.json();

    if (!flow_id || !step_number || !type) {
      return Response.json(
        { error: "flow_id, step_number, and type are required" },
        { status: 400 }
      );
    }

    const { data: step, error } = await supabase
      .from("flow_steps")
      .insert([
        {
          flow_id,
          step_number,
          type,
          config: config || {}
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to create flow step" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      step
    });

  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

