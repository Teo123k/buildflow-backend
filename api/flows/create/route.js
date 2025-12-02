import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { name, description, data } = await request.json();

    if (!name || !data) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const { data: flow, error } = await supabase
      .from("flows")
      .insert([
        {
          name,
          description: description || "",
          data
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save flow." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, flow });
  } catch (err) {
    console.error("Server error saving flow:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

