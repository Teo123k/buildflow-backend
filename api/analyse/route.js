import { fetch_raw_html, analyse_html } from "../../../lib/modules/analyse_html.js";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing URL"
      }), { status: 400 });
    }

    const raw = await fetch_raw_html(url);

    if (!raw.success) {
      return new Response(JSON.stringify(raw), { status: 400 });
    }

    const analysis = analyse_html(raw.html);

    return new Response(JSON.stringify({
      success: true,
      raw_html: raw.html,
      analysis
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500 });
  }
}

}


