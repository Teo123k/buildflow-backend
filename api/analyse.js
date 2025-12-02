// api/analyse.js
import { fetch_raw_html, analyse_html } from "../lib/modules/analyse_html.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
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

    return new Response(
      JSON.stringify({
        success: true,
        raw_html: html,
        analysis,
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
          "Unknown error while analysing HTML",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}




