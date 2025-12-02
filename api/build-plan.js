// api/build-plan.js
import { fetch_raw_html, analyse_html } from "../lib/modules/analyse_html.js";
import { createWorkflow } from "../lib/modules/guided_workflow.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({ status: "Build-plan API online" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing or invalid URL" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const raw = await fetch_raw_html(url);

    if (!raw || raw.success === false) {
      return new Response(
        JSON.stringify(
          raw || { success: false, error: "Failed to fetch HTML" }
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const html = raw.html ?? "";
    const analysis = analyse_html(html);

    const result = createWorkflow(
      { url, analysis },
      url // idea / label
    );

    if (!result || result.success === false) {
      return new Response(
        JSON.stringify(
          result || { success: false, error: "Failed to create workflow" }
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          (err && err.message) ||
          "Unknown error while building workflow",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


