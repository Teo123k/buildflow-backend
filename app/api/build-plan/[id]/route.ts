import { supabase } from "../../../lib/supabaseClient";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { data, error } = await supabase
      .from("build_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return new Response(JSON.stringify({ success: false, error }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

