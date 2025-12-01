import * as cheerio from "cheerio";

/**
 * Fetch raw HTML from a URL
 */
export async function fetch_raw_html(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status} – ${res.statusText}`,
        html: "",
        status_code: res.status,
      };
    }

    const html = await res.text();

    return {
      success: true,
      html,
      status_code: res.status,
      error: "",
    };
  } catch (err: any) {
    return {
      success: false,
      html: "",
      status_code: null,
      error: err.message || "Unknown error",
    };
  }
}

/**
 * Analyse basic HTML structure
 */
export function analyse_html(html: string) {
  try {
    const $ = cheerio.load(html);

    const title = $("title").text() || null;
    const description =
      $('meta[name="description"]').attr("content") || null;

    const h1 = $("h1")
      .map((_, el) => $(el).text().trim())
      .get();

    const h2 = $("h2")
      .map((_, el) => $(el).text().trim())
      .get();

    const bodyText = $("body").text().trim();
    const p_count = $("p").length;

    const issues: string[] = [];

    if (!title) issues.push("missing title");
    if (!description) issues.push("missing meta description");

    if (h1.length === 0) issues.push("no H1 tags");
    if (h1.length > 1) issues.push("multiple H1 tags");
    };
  }
}
