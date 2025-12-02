import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { flow_id, step_id } = await request.json();

    if (!flow_id) {
      return Response.json(
        { error: "flow_id is required" },
        { status: 400 }
      );
    }

    // If step_id is provided → return just that step
    if (step_id) {
      const { data: step, error } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("id", step_id)
        .single();

      if (error) {
        console.error("Error fetching step:", error);
        return Response.json(
          { error: "Could not fetch step" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        step
      });
    }

    // Otherwise return all steps for the flow ordered by step number
    const { data: steps, error } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", flow_id)
      .order("step_number", { ascending: true });

    if (error) {
      console.error("Error fetching steps:", error);
      return Response.json(
        { error: "Could not fetch steps" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      steps
    });

  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

