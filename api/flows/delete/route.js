import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json(
        { error: "Flow ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("flows")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return Response.json(
        { error: "Failed to delete flow" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Flow deleted successfully"
    });

  } catch (err) {
    console.error("Server error deleting flow:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

