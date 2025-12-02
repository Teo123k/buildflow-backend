import { safeResponse } from "../safeResponse.js";

async function fetchRawHtml(url) {
  return {
    success: true,
    html: `<html><body><h1>Dummy HTML for ${url}</h1></body></html>`
  };
}

function analyzeBasicStructure(html) {
  return {
    basic_issues: [],
    notes: "Structure analysis not implemented yet (stub)."
  };
}

function generateTasks(basicIssues) {
  return [
    {
      issue: "analysis_not_implemented",
      task: "Port analyse_html and task_manager modules from Python.",
      priority: "medium"
    }
  ];
}

export async function analyseWebsite(request) {
  console.log(`[ENDPOINT] /analyse for: ${request.url}`);

  try {
    const fetchResult = await fetchRawHtml(request.url);

    if (!fetchResult.success) {
      return safeResponse({
        success: false,
        error: "Failed to fetch URL",
        fetch: fetchResult,
        structure: null,
        tasks: []
      });
    }

    const structureResult = analyzeBasicStructure(fetchResult.html);
    const tasks = generateTasks(structureResult.basic_issues || []);

    return safeResponse({
      success: true,
      fetch: fetchResult,
      structure: structureResult,
      tasks
    });

  } catch (err) {
    return safeResponse({
      success: false,
      error: `Analysis failed: ${String(err.message)}`,
      fetch: null,
      structure: null,
      tasks: []
    });
  }
}
