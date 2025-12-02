// api/build-plan/route.js
import { fetch_raw_html, analyse_html } from "../../lib/modules/analyse_html.js";
import { createWorkflow } from "../../lib/modules/guided_workflow.js";

export function GET() {
  return new Response(
    JSON.stringify({ status: "Build-plan API online" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing URL" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Fetch HTML
    const raw = await fetch_raw_html(url);

    if (!raw.success) {
      return new Response(JSON.stringify(raw), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Analyse HTML
    const analysis = analyse_html(raw.html);

    // Build workflow
    const result = createWorkflow(
      { url, analysis },
      url // idea
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        workflow: result.workflow,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}


