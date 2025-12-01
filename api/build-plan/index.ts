// api/build-plan/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ error: "Method not allowed. Only GET is supported." });
    }

    // Fetch all plans
    const { data, error } = await supabase
      .from("build_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch build plans",
        detail: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      plans: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message ?? String(err),
    });
  }
}

