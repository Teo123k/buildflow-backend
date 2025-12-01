// lib/utils/generate_prompts.ts

/**
 * Simple AI task improver.
 * 
 * Later we will connect this to OpenAI, but for now
 * it returns a static structure so everything works.
 */

export function improveTaskWithAI(issue: string, task: string) {
  return {
    explanation: `AI suggestion: This task is related to the issue "${issue}".`,
    ai_prompt: `Provide detailed instructions to fix: ${issue}.`
  };
}

