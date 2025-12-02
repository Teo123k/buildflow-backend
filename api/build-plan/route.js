// api/build-plan/route.js
import { fetch_raw_html, analyse_html } from "../../../lib/modules/analyse_html.js";
import { createWorkflow } from "../../../lib/modules/guided_workflow.js";

export function GET() {
  return new Response(
    JSON.stringify({ status: "Build-plan API online" }),
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing URL" }),
        { status: 400 }
      );
    }

    const raw = await fetch_raw_html(url);

    if (!raw.success) {
      return new Response(JSON.stringify(raw), { status: 400 });
    }

    const analysis = analyse_html(raw.html);

    const { success, workflow, error } = createWorkflow(
      { url, analysis },
      url
    );

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        workflow,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}

}


