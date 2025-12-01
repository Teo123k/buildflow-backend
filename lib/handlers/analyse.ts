// lib/handlers/analyse.ts

import type { URLRequest } from "../types";
import { safeResponse } from "../safeResponse";

/**
 * TEMP stubs – replace with real implementations
 * when we port modules/analyse_html.py and task_manager.py
 */
async function fetchRawHtml(url: string) {
  // TODO: replace with real logic (requests, etc.)
  // For now we just return a fake success so the endpoint works.
  return {
    success: true,
    html: `<html><body><h1>Dummy HTML for ${url}</h1></body></html>`
  };
}

function analyzeBasicStructure(html: string) {
  // TODO: real analysis logic
  return {
    basic_issues: [],
    notes: "Structure analysis not implemented yet (stub)."
  };
}

function generateTasks(basicIssues: unknown[]) {
  // TODO: real task generation logic
  return [
    {
      issue: "analysis_not_implemented",
      task: "Port analyse_html and task_manager modules from Python.",
      priority: "medium"
    }
  ];
}

/**
 * Main analyse handler – this is the TS equivalent of
 * the /analyse endpoint body in main.py.
 */
export async function analyseWebsite(request: URLRequest) {
  console.log(`[ENDPOINT] /analyse called for: ${request.url}`);

  try {
    const fetchResult = await fetchRawHtml(request.url);

    if (!fetchResult.success) {
      console.log(
        `[ENDPOINT] /analyse fetch failed: ${String(
          (fetchResult as any).error ?? "unknown"
        )}`
      );

      return safeResponse({
        success: false,
        error: String((fetchResult as any).error ?? "Failed to fetch URL"),
        fetch: fetchResult,
        structure: null,
        tasks: []
      });
    }

    const structureResult = analyzeBasicStructure(fetchResult.html);
    const tasks = generateTasks(structureResult.basic_issues ?? []);

    console.log(`[ENDPOINT] /analyse success for: ${request.url}`);
    return safeResponse({
      success: true,
      fetch: fetchResult,
      structure: structureResult,
      tasks
    });
  } catch (err: any) {
    console.log(`[ENDPOINT] /analyse exception: ${err?.message || err}`);
    return safeResponse({
      success: false,
      error: `Analysis failed: ${String(err?.message || err).slice(0, 100)}`,
      fetch: null,
      structure: null,
      tasks: []
    });
  }
}

