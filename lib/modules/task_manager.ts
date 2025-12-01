// lib/modules/task_manager.ts
import { z } from "zod";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Schema for individual task definitions
 */
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  createdAt: z.string(),
});

/**
 * Schema for a list of tasks
 */
export type Task = z.infer<typeof TaskSchema>;

/**
 * Generates tasks using OpenAI LLM
 */
export async function generateTasks(prompt: string): Promise<Task[]> {
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
    response_format: {
      type: "json_object",
    },
  });

  const raw = completion.choices[0].message?.content || "{}";
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.tasks)) {
    throw new Error("AI did not return a valid tasks array.");
  }

  return parsed.tasks.map((t: any) => TaskSchema.parse(t));
}

/**
 * Updates a single task
 */
export function updateTask(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
}

