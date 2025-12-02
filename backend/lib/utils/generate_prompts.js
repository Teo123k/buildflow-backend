// lib/utils/generate_prompts.js

/**
 * Simple AI task improver.
 *
 * Placeholder module – later we will connect this to OpenAI.
 * For now it returns a static structure so everything works.
 */

export function improveTaskWithAI(issue, task) {
  return {
    explanation: `AI suggestion: This task is related to the issue "${issue}".`,
    ai_prompt: `Provide detailed instructions to fix: ${issue}.`
  };
}
