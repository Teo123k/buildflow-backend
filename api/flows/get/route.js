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

    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching flow:", error);
      return Response.json(
        { error: "Could not fetch flow" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      flow: data
    });

  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

