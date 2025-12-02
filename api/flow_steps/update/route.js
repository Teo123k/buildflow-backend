import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { id, step_number, type, config } = await request.json();

    if (!id) {
      return Response.json(
        { error: "step_id (id) is required" },
        { status: 400 }
      );
    }

    const updateFields = {};

    if (step_number !== undefined) updateFields.step_number = step_number;
    if (type) updateFields.type = type;
    if (config) updateFields.config = config;

    const { data: updatedStep, error } = await supabase
      .from("flow_steps")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return Response.json(
        { error: "Failed to update flow step" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      step: updatedStep
    });

  } catch (err) {
    console.error("Server error updating step:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

