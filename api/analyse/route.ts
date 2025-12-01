import { NextResponse } from "next/server";
import { fetch_raw_html, analyse_html } from "@/lib/modules/analyse_html";
import { generate_tasks } from "@/lib/modules/task_manager";
import { generate_all_prompts } from "@/lib/modules/prompt_generation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({
        success: false,
        error: "Invalid or missing URL",
      });
    }

    console.log("[ANALYSE] Fetching:", url);

    // 1. Fetch HTML
    const fetchResult = await fetch_raw_html(url);

    if (!fetchResult.success) {
      return NextResponse.json({
        success: false,
        error: fetchResult.error,
        structure: null,
        tasks: [],
        prompts: {},
      });
    }

    // 2. Analyse structure
    const structure = analyse_html(fetchResult.html);

    // 3. Generate tasks from detected issues
    const tasks = generate_tasks(structure.basic_issues);

    // 4. Generate prompts based on tasks + structure
    const prompts = generate_all_prompts({ structure, tasks });

    return NextResponse.json({
      success: true,
      fetch: fetchResult,
      structure,
      tasks,
      prompts,
    });
  } catch (error: any) {
    console.error("[ANALYSE ERROR]", error);

    return NextResponse.json({
      success: false,
      error: String(error),
      structure: null,
      tasks: [],
      prompts: {},
    });
  }
}

