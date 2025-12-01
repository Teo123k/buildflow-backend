// lib/modules/guided_workflow.ts

import { generateFixPrompt as buildPlannerGenerateFixPrompt } from "./build_planner";

export type StepStatus = "pending" | "in_progress" | "completed";

export interface WorkflowStep {
  id: number;
  order: number;
  title: string;
  area: string;
  category: string;
  why_it_matters: string;
  files_to_edit: string[];
  micro_step_instructions: string[];
  replit_prompt?: string;
  validation_check: string[];
  priority: "A" | "B" | "C";
  status: StepStatus;
  estimated_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  steps: number[];
}

export interface PhaseProgress {
  id: string;
  name: string;
  description: string;
  total: number;
  completed: number;
  percent: number;
  status: "pending" | "in_progress" | "completed";
}

export interface Workflow {
  idea: string;
  app_summary: string;
  summary: string;
  tech_stack: any;
  directory_structure: any[];
  user_flow: any[];
  phases: WorkflowPhase[];
  phase_progress: PhaseProgress[];
  build_steps: WorkflowStep[];
  steps: WorkflowStep[];
  grouped_steps: {
    A: WorkflowStep[];
    B: WorkflowStep[];
    C: WorkflowStep[];
  };
  progress: {
    total: number;
    completed: number;
    percent: number;
    current_step: number;
    next_step: number;
  };
  phase: {
    name: string;
    id: string;
    description: string;
    emoji: string;
    percent: number;
    encouragement: string;
  };
  progress_hint: string;
  testing_unlocked: boolean;
}

// ---------------- Helpers ----------------

function areaToPriority(area: string): "A" | "B" | "C" {
  const map: Record<string, "A" | "B" | "C"> = {
    frontend: "A",
    backend: "A",
    database: "A",
    ai_logic: "B",
    integration: "B",
    ux: "C",
  };
  return map[area] ?? "B";
}

function getPhaseEmoji(id: string) {
  const emojis: Record<string, string> = {
    A: "🏗️",
    B: "💾",
    C: "📁",
    D: "🤖",
    E: "📱",
    F: "📚",
    G: "✨",
  };
  return emojis[id] ?? "🔨";
}

function getPhaseEncouragement(phaseId: string, percent: number) {
  if (percent === 0) return "Let's get started!";
  if (percent < 50) return "Great progress—keep going!";
  if (percent < 100) return "Almost done with this phase!";
  return "Phase complete!";
}

function determinePhaseByPercent(percent: number) {
  if (percent < 30)
    return {
      name: "Foundation",
      id: "A",
      description: "Setting up the basics!",
      emoji: "🏗️",
      percent,
      encouragement: "Great start!",
    };

  if (percent < 70)
    return {
      name: "Building",
      id: "B",
      description: "Adding the main features!",
      emoji: "🔨",
      percent,
      encouragement: "You're doing amazing!",
    };

  if (percent < 100)
    return {
      name: "Polish",
      id: "G",
      description: "Making it perfect!",
      emoji: "✨",
      percent,
      encouragement: "So close!",
    };

  return {
    name: "Complete",
    id: "Z",
    description: "Your app is ready!",
    emoji: "🚀",
    percent: 100,
    encouragement: "Congratulations!",
  };
}

function generateBuildPrompt(step: WorkflowStep, context = "") {
  const ctx = context.slice(0, 200);
  const why = step.why_it_matters;

  const notes = [
    `You are helping build: ${ctx || "an app"}`,
    `Current step: ${step.title}`,
    `Why this matters: ${why}`,
    `Area: ${step.area} (${step.category}), priority ${step.priority}`,
  ];

  if (step.files_to_edit.length)
    notes.push("Files: " + step.files_to_edit.join(", "));
  if (step.micro_step_instructions.length) {
    notes.push("Follow micro-steps:");
    step.micro_step_instructions.forEach((m, i) =>
      notes.push(`${i + 1}. ${m}`)
    );
  }

  notes.push("");
  notes.push("Rules:");
  notes.push("- Only do the required change.");
  notes.push("- Keep code simple.");

  return notes.join("\n");
}

// ---------------- Step Extraction ----------------

function generateFallbackSteps(idea: string): WorkflowStep[] {
  return [
    {
      id: 1,
      order: 1,
      title: "Set up your project",
      area: "backend",
      category: "setup",
      why_it_matters: "Every app needs a foundation.",
      files_to_edit: ["main.ts"],
      micro_step_instructions: [
        "Create entry file",
        "Add health endpoint",
        "Run server",
      ],
      replit_prompt: `Create a minimal backend for: ${idea.slice(0, 80)}`,
      validation_check: ["Server runs", "Endpoint works"],
      priority: "A",
      status: "pending",
      estimated_minutes: 20,
      difficulty: "easy",
    },
  ];
}

function extractStepsFromBlueprint(blueprint: any, idea: string) {
  const phases = Array.isArray(blueprint?.phases) ? blueprint.phases : [];
  const results: WorkflowStep[] = [];
  let idCounter = 1;

  if (phases.length === 0) return generateFallbackSteps(idea);

  for (const p of phases) {
    for (const s of p.steps || []) {
      const area = String(s.area || s.category || "feature").toLowerCase();
      const priority = areaToPriority(area);

      const step: WorkflowStep = {
        id: idCounter,
        order: idCounter,
        title: String(s.title || `Step ${idCounter}`),
        area,
        category: s.category || area,
        why_it_matters:
          s.why_it_matters || s.reason || "This step moves the app forward.",
        files_to_edit: s.files_to_edit || [],
        micro_step_instructions: s.micro_step_instructions || [],
        replit_prompt:
          s.replit_prompt ||
          generateBuildPrompt(s, blueprint.summary || ""),
        validation_check: s.validation_check || [],
        priority,
        status: s.status || "pending",
        estimated_minutes: s.estimated_minutes || 20,
        difficulty: s.difficulty || "medium",
      };

      results.push(step);
      idCounter++;
    }
  }

  return results.length ? results : generateFallbackSteps(idea);
}

function generatePhasesFromSteps(steps: WorkflowStep[]): WorkflowPhase[] {
  const map: Record<string, WorkflowPhase> = {};

  const areaMap: Record<string, [string, string, string]> = {
    backend: ["A", "Phase A – Foundation", "Setting up backend basics"],
    frontend: ["A", "Phase A – Foundation", "Setting up UI"],
    database: ["B", "Phase B – Data", "Adding persistent storage"],
    ai_logic: ["D", "Phase D – AI", "Building AI logic"],
    integration: ["E", "Phase E – Integration", "Connecting everything"],
    ux: ["G", "Phase G – Polish", "Making it smooth"],
  };

  for (const step of steps) {
    const [id, name, desc] =
      areaMap[step.area] || ["B", "Phase B – Build", "Feature building"];

    if (!map[id]) map[id] = { id, name, description: desc, steps: [] };

    map[id].steps.push(step.id);
  }

  return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
}

function calculatePhaseProgress(
  phases: WorkflowPhase[],
  steps: WorkflowStep[]
): PhaseProgress[] {
  const status: Record<number, StepStatus> = {};
  steps.forEach((s) => (status[s.id] = s.status));

  return phases.map((p) => {
    const total = p.steps.length;
    const completed = p.steps.filter((id) => status[id] === "completed")
      .length;
    const percent = total ? Math.floor((completed / total) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      total,
      completed,
      percent,
      status:
        percent === 100
          ? "completed"
          : percent > 0
          ? "in_progress"
          : "pending",
    };
  });
}

// ---------------- MAIN FUNCTION ----------------

export function createWorkflow(
  blueprint: any,
  idea: string = ""
): {
  success: boolean;
  workflow: Workflow | null;
  error?: string;
} {
  try {
    const steps = extractStepsFromBlueprint(blueprint, idea);
    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.status === "completed")
      .length;

    const progressPercent =
      totalSteps > 0
        ? Math.floor((completedSteps / totalSteps) * 100)
        : 0;

    let phases = Array.isArray(blueprint?.phases)
      ? blueprint.phases.map((p: any, idx: number) => {
          const id =
            typeof p.id === "string" && p.id.trim()
              ? p.id
              : String.fromCharCode("A".charCodeAt(0) + idx);

          const stepIds: number[] = [];
          for (const s of p.steps || []) {
            const match = steps.find(
              (st) => st.title === s.title || st.id === s.id
            );
            if (match) stepIds.push(match.id);
          }

          return {
            id,
            name: p.name || `Phase ${id}`,
            description: p.description || "Related steps",
            steps: stepIds,
          };
        })
      : [];

    if (phases.length === 0) phases = generatePhasesFromSteps(steps);

    const phaseProgress = calculatePhaseProgress(phases, steps);

    const phase = (() => {
      for (const p of phaseProgress) {
        if (p.status !== "completed")
          return {
            name: p.name,
            id: p.id,
            description: p.description,
            emoji: getPhaseEmoji(p.id),
            percent: p.percent,
            encouragement: getPhaseEncouragement(p.id, p.percent),
          };
      }
      return determinePhaseByPercent(100);
    })();

    const grouped = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    const workflow: Workflow = {
      idea,
      app_summary:
        blueprint.app_summary ||
        blueprint.summary ||
        "Let's build something awesome!",
      summary:
        blueprint.summary ||
        blueprint.app_summary ||
        "Let's build something awesome!",
      tech_stack: blueprint.stack || blueprint.tech_stack || {},
      directory_structure:
        blueprint.directory_structure || blueprint.directories || [],
      user_flow: blueprint.user_flow || [],
      phases,
      phase_progress: phaseProgress,
      build_steps: steps,
      steps,
      grouped_steps: grouped,
      progress: {
        total: totalSteps,
        completed: completedSteps,
        percent: progressPercent,
        current_step: steps.find((s) => s.status !== "completed")?.order || 1,
        next_step: steps.find((s) => s.status !== "completed")?.id || 0,
      },
      phase,
      progress_hint:
        blueprint.progress_hint || "Follow each step to build your app!",
      testing_unlocked: progressPercent >= 70,
    };

    return { success: true, workflow };
  } catch (err: any) {
    return {
      success: false,
      workflow: null,
      error: String(err).slice(0, 100),
    };
  }
}

// ---------------- UTILITIES ----------------

export function updateStepStatus(
  workflow: Workflow,
  stepId: number,
  newStatus: StepStatus
) {
  try {
    const steps = workflow.build_steps;

    for (const step of steps) {
      if (step.id === stepId) {
        step.status = newStatus;
        break;
      }
    }

    const total = steps.length;
    const completed = steps.filter((s) => s.status === "completed").length;
    const percent =
      total > 0 ? Math.floor((completed / total) * 100) : 0;

    workflow.build_steps = steps;
    workflow.steps = steps;

    workflow.progress = {
      total,
      completed,
      percent,
      current_step: steps.find((s) => s.status !== "completed")?.order || 1,
      next_step: steps.find((s) => s.status !== "completed")?.id || 0,
    };

    workflow.phase_progress =
      calculatePhaseProgress(workflow.phases, steps);

    workflow.phase = determinePhaseByPercent(percent);
    workflow.testing_unlocked = percent >= 70;

    workflow.grouped_steps = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    return { success: true, workflow };
  } catch (err: any) {
    return {
      success: false,
      error: String(err).slice(0, 100),
      workflow,
    };
  }
}

export function getStepPrompt(step: WorkflowStep, context = "") {
  return step.replit_prompt || generateBuildPrompt(step, context);
}

export function getFixPrompt(errorMessage: string, step?: WorkflowStep) {
  const context = step
    ? `Working on: ${step.title} - ${step.why_it_matters}`
    : "";
  return buildPlannerGenerateFixPrompt(errorMessage, context);
}

export function getNextStep(workflow: Workflow) {
  for (const step of workflow.build_steps) {
    if (step.status !== "completed") {
      return {
        success: true,
        step,
        prompt: step.replit_prompt || generateBuildPrompt(step),
      };
    }
  }

  return {
    success: true,
    step: null,
    message: "All steps completed!",
  };
}

export function generateAllPrompts(workflow: Workflow) {
  const prompts: Record<string, string> = {};
  const context = workflow.summary;

  for (const step of workflow.build_steps) {
    prompts[String(step.id)] =
      step.replit_prompt || generateBuildPrompt(step, context);
  }

  return prompts;
}

export function getStepDetails(step: WorkflowStep) {
  return {
    id: step.id,
    title: step.title,
    area: step.area,
    why_it_matters: step.why_it_matters,
    files_to_edit: step.files_to_edit,
    micro_step_instructions: step.micro_step_instructions,
    replit_prompt: step.replit_prompt,
    validation_check: step.validation_check,
    priority: step.priority,
    status: step.status,
  };
}


