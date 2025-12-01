// api/build-plan/index.ts
import { supabase } from "../../../lib/supabaseClient";

export async function GET(req: Request): Promise<Response> {
  try {
    // Fetch all plans
    const { data, error } = await supabase
      .from("build_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        {
          success: false,
          error: "Failed to fetch build plans",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        plans: data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: "Server error",
        detail: err.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

