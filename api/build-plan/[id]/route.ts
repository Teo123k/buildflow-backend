import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing plan ID" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("build_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, plan: data },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

