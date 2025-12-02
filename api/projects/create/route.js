import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return Response.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      project: data
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

