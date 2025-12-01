/**
 * Prompt Generation Module
 *
 * Turns analysis results + tasks into ready-made prompts
 * that users can copy/paste into Replit or ChatGPT.
 */

export function generate_all_prompts(analysis_results: any) {
  const { structure, tasks } = analysis_results;

  const promptSections: any = {};

  // 1. High-level summary
  promptSections.summary = generate_summary(structure);

  // 2. Individual fix prompts
  promptSections.fix_prompts = tasks.map((t: any) =>
    format_single_prompt(t)
  );

  // 3. Step-by-step cleaning guide
  promptSections.step_by_step = generate_step_by_step(tasks);

  // 4. Grouped by priority
  promptSections.grouped = group_by_priority(tasks);

  return promptSections;
}

/**
 * Create a human-readable summary of all detected issues.
 */
function generate_summary(structure: any) {
  if (!structure) {
    return "No structure was analyzed.";
  }

  return `
HTML Structure Summary:
• Title: ${structure.title || "❌ Missing"}
• Meta Description: ${
    structure.description ? "✔️ Present" : "❌ Missing"
  }
• H1 Tags: ${structure.h1.length}
• H2 Tags: ${structure.h2.length}
• Paragraphs: ${structure.p_count}

Detected Issues:
${structure.basic_issues.length > 0 ? structure.basic_issues.map((i: any) => `• ${i}`).join("\n") : "None 🎉"}
  `.trim();
}

/**
 * Format a single task into a clean copy/paste prompt.
 */
function format_single_prompt(task: any) {
  return `
ISSUE: ${task.issue}
FIX: ${task.task}
HOW TO FIX:
${task.prompt}
  `.trim();
}

/**
 * Create a step-by-step fixing guide.
 */
function generate_step_by_step(tasks: any[]) {
  let steps: string[] = [];

  tasks.forEach((t, index) => {
    steps.push(`STEP ${index + 1}: ${t.task}\n→ ${t.prompt}`);
  });

  return steps;
}

/**
 * Group tasks by priority.
 */
function group_by_priority(tasks: any[]) {
  const groups: any = {
    high: [],
    medium: [],
    low: []
  };

  tasks.forEach((t) => {
    groups[t.priority].push(t);
  });

  return groups;
}

