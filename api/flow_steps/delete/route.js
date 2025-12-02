import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Step ID (id) is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("flow_steps")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return Response.json(
        { error: "Failed to delete flow step" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Flow step deleted successfully"
    });

  } catch (err) {
    console.error("Server error deleting step:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

