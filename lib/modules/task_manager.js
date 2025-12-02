// lib/modules/task_manager.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simple validation helper (replaces zod)
 */
function validateTask(task) {
  if (!task || typeof task !== "object") return false;
  if (!task.id || !task.title) return false;
  return true;
}

/**
 * Generate tasks using OpenAI
 */
export async function generateTasks(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You generate structured workflow tasks in JSON. Only return raw JSON, no explanation.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.tasks)) {
    throw new Error("AI did not return a valid tasks array.");
  }

  // Validate each task
  const tasks = parsed.tasks.filter((t) => validateTask(t));

  return tasks;
}

/**
 * Update a single task inside the tasks array
 */
export function updateTask(tasks, taskId, updates) {
  return tasks.ma

