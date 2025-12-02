import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { id, name, description, data } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Flow ID is required" },
        { status: 400 }
      );
    }

    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (description) fieldsToUpdate.description = description;
    if (data) fieldsToUpdate.data = data;

    fieldsToUpdate.updated_at = new Date().toISOString();

    const { data: updatedFlow, error } = await supabase
      .from("flows")
      .update(fieldsToUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return Response.json(
        { error: "Failed to update flow" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      flow: updatedFlow
    });

  } catch (err) {
    console.error("Server error updating flow:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

