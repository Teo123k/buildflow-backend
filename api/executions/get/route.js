import 'dotenv/config';
import { supabase } from "../../../../supabaseClient.js";

export async function POST(request) {
  try {
    const { flow_id, execution_id } = await request.json();

    if (!flow_id && !execution_id) {
      return Response.json(
        { error: "Either flow_id or execution_id is required" },
        { status: 400 }
      );
    }

    // If execution_id is provided → return a single execution
    if (execution_id) {
      const { data: execution, error } = await supabase
        .from("executions")
        .select("*")
        .eq("id", execution_id)
        .single();

      if (error) {
        console.error("Error fetching execution:", error);
        return Response.json(
          { error: "Could not fetch execution" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        execution
      });
    }

    // Otherwise, list all executions for a flow
    const { data: executions, error } = await supabase
      .from("executions")
      .select("*")
      .eq("flow_id", flow_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching executions:", error);
      return Response.json(
        { error: "Could not fetch executions" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      executions
    });

  } catch (err) {
    console.error("Server error in executions/get:", err);
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

