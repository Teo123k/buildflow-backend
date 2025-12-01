// lib/modules/guided_workflow.ts

import { generateFixPrompt as buildPlannerGenerateFixPrompt } from "./build_planner";

export type StepStatus = "pending" | "in_progress" | "completed";

export interface WorkflowStep {
  id: number;
  order: number;
  title: string;
  area: string; // frontend | backend | database | ai_logic | integration | ux | setup | feature
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
  id: string; // A, B, C ...
  name: string;
  description: string;
  steps: number[]; // step IDs
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

export interface CreateWorkflowResult {
  success: boolean;
  error?: string;
  workflow: Workflow | null;
}

// ---------- Helpers ----------

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

function getPhaseEmoji(phaseId: string): string {
  const emojis: Record<string, string> = {
    A: "🏗️",
    B: "💾",
    C: "📁",
    D: "🤖",
    E: "📱",
    F: "📚",
    G: "✨",
  };
  return emojis[phaseId] ?? "🔨";
}

function getPhaseEncouragement(phaseId: string, percent: number): string {
  if (percent === 0) {
    return "Let's get started! This is going to be awesome!";
  } else if (percent < 50) {
    return "Great progress! Keep going, you're doing amazing!";
  } else if (percent < 100) {
    return "Almost done with this phase! You're so close!";
  } else {
    return "Phase complete! On to the next adventure!";
  }
}

function determinePhaseByPercent(progressPercent: number) {
  if (progressPercent < 30) {
    return {
      name: "Foundation",
      id: "A",
      description: "Setting up the basics!",
      emoji: "🏗️",
      percent: progressPercent,
      encouragement: "Great start! You're building something awesome!",
    };
  } else if (progressPercent < 70) {
    return {
      name: "Building",
      id: "B",
      description: "Adding the main features!",
      emoji: "🔨",
      percent: progressPercent,
      encouragement: "You're doing amazing! The app is taking shape!",
    };
  } else if (progressPercent < 100) {
    return {
      name: "Polish",
      id: "G",
      description: "Making it perfect!",
      emoji: "✨",
      percent: progressPercent,
      encouragement: "So close! Just a few more touches!",
    };
  } else {
    return {
      name: "Complete",
      id: "Z",
      description: "Your app is ready!",
      emoji: "🚀",
      percent: 100,
      encouragement: "Congratulations! Time to publish!",
    };
  }
}

// Build a clean, AI-friendly prompt for a single step.
// This does NOT call OpenAI – it's a prompt you can paste into Replit/Copilot etc.
function generateBuildPrompt(step: WorkflowStep, context: string = ""): string {
  const ctx = context ? context.slice(0, 200) : "";
  const why = step.why_it_matters || "This step is important for the app to work correctly.";

  const notes: string[] = [];
  notes.push(`You are helping build an app: ${ctx || "AI Build Coach style app."}`);
  notes.push(`Current step: ${step.title}`);
  notes.push(`Why this matters: ${why}`);
  notes.push(`Area: ${step.area} (${step.category}), priority ${step.priority}.`);
  if (step.files_to_edit.length > 0) {
    notes.push(`Key files to edit: ${step.files_to_edit.join(", ")}`);
  }
  if (step.micro_step_instructions.length > 0) {
    notes.push("Follow these micro-steps in order:");
    step.micro_step_instructions.forEach((m, i) => {
      notes.push(`${i + 1}. ${m}`);
    });
  }

  notes.push("");
  notes.push("Rules:");
  notes.push("- Do the smallest possible change to complete THIS step only.");
  notes.push("- Keep the code simple and readable.");
  notes.push("- Return only code or precise instructions, no long essays.");

  return notes.join("\n");
}

// ---------- Core Conversion Logic ----------

function generateFallbackSteps(idea: string): WorkflowStep[] {
  const base: WorkflowStep = {
    id: 1,
    order: 1,
    title: "Set up your project",
    area: "backend",
    category: "setup",
    why_it_matters: "Every app needs a solid foundation before you add features.",
    files_to_edit: ["main.ts"],
    micro_step_instructions: [
      "Create the main entry file for your backend.",
      "Add a simple health-check endpoint.",
      "Run it locally and confirm it responds with JSON.",
    ],
    replit_prompt: `Create a minimal Node.js/Vercel API backend for: ${idea.slice(
      0,
      80
    )}. Add a /health endpoint that returns JSON.`,
    validation_check: ["Server starts", "Endpoint returns JSON"],
    priority: "A",
    status: "pending",
    estimated_minutes: 20,
    difficulty: "easy",
  };

  return [base];
}

// Flatten phases[].steps from the blueprint into a list of WorkflowStep objects.
function extractStepsFromBlueprint(blueprint: any, idea: string): WorkflowStep[] {
  const phases = Array.isArray(blueprint?.phases) ? blueprint.phases : [];
  const result: WorkflowStep[] = [];
  let idCounter = 1;

  if (phases.length === 0) {
    return generateFallbackSteps(idea);
  }

  for (const phase of phases) {
    const phaseSteps = Array.isArray(phase.steps) ? phase.steps : [];
    for (const s of phaseSteps) {
      const rawArea =
        s.area ||
        s.category ||
        s.type ||
        "feature";

      const area = String(rawArea).toLowerCase();
      const priority = areaToPriority(area);

      const step: WorkflowStep = {
        id: idCounter,
        order: idCounter,
        title: String(s.title || `Step ${idCounter}`),
        area,
        category: s.category || area,
        why_it_matters:
          s.why_it_matters ||
          s.reason ||
          "This step is important to move the project forward.",
        files_to_edit: Array.isArray(s.files_to_edit) ? s.files_to_edit : [],
        micro_step_instructions: Array.isArray(s.micro_step_instructions)
          ? s.micro_step_instructions
          : [],
        replit_prompt: s.replit_prompt, // fallback later
        validation_check: Array.isArray(s.validation_check)
          ? s.validation_check
          : [],
        priority,
        status: (s.status as StepStatus) || "pending",
        estimated_minutes:
          typeof s.estimated_minutes === "number" ? s.estimated_minutes : 20,
        difficulty:
          (s.difficulty as "easy" | "medium" | "hard") || "medium",
      };

      if (!step.replit_prompt) {
        step.replit_prompt = generateBuildPrompt(step, blueprint?.summary || "");
      }

      result.push(step);
      idCounter++;
    }
  }

  if (result.length === 0) {
    return generateFallbackSteps(idea);
  }

  return result;
}

function generatePhasesFromSteps(steps: WorkflowStep[]): WorkflowPhase[] {
  const phaseMap: Record<
    string,
    { id: string; name: string; description: string; steps: number[] }
  > = {};

  const areaPhaseMap: Record<string, [string, string, string]> = {
    backend: ["A", "Phase A – Foundation", "Setting up the backend basics!"],
    frontend: ["A", "Phase A – Foundation", "Setting up what users see!"],
    database: ["B", "Phase B – Core Data", "Teaching your app to remember things!"],
    ai_logic: ["D", "Phase D – AI Agents", "Creating the AI brains!"],
    integration: ["E", "Phase E – Integration", "Connecting all the pieces!"],
    ux: ["G", "Phase G – Polish", "Making it smooth and easy to use!"],
  };

  for (const step of steps) {
    const area = step.area || step.category || "feature";
    const [phaseId, phaseName, phaseDesc] =
      areaPhaseMap[area] || ["B", "Phase B – Building", "Building features!"];

    if (!phaseMap[phaseId]) {
      phaseMap[phaseId] = {
        id: phaseId,
        name: phaseName,
        description: phaseDesc,
        steps: [],
      };
    }

    phaseMap[phaseId].steps.push(step.id);
  }

  return Object.values(phaseMap).sort((a, b) => a.id.localeCompare(b.id));
}

function calculatePhaseProgress(
  phases: WorkflowPhase[],
  steps: WorkflowStep[]
): PhaseProgress[] {
  const statusById: Record<number, StepStatus> = {};
  for (const s of steps) {
    statusById[s.id] = s.status || "pending";
  }

  const result: PhaseProgress[] = [];

  for (const phase of phases) {
    const phaseSteps = phase.steps;
    const total = phaseSteps.length;
    const completed = phaseSteps.filter(
      (id) => statusById[id] === "completed"
    ).length;
    const percent = total > 0 ? Math.floor((completed / total) * 100) : 0;

    result.push({
      id: phase.id,
      name: phase.name,
      description: phase.description,
      total,
      completed,
      percent,
      status:
        percent === 100
          ? "completed"
          : percent > 0
          ? "in_progress"
          : "pending",
    });
  }

  return result;
}

function determineCurrentPhase(phaseProgress: PhaseProgress[]) {
  for (const phase of phaseProgress) {
    if (phase.status !== "completed") {
      return {
        name: phase.name || "Building",
        id: phase.id || "A",
        description: phase.description || "Working on your app!",
        emoji: getPhaseEmoji(phase.id),
        percent: phase.percent,
        encouragement: getPhaseEncouragement(phase.id, phase.percent),
      };
    }
  }
  return {
    name: "Complete",
    id: "Z",
    description: "Your app is ready!",
    emoji: "🚀",
    percent: 100,
    encouragement: "Congratulations! You built an app! Time to publish!",
  };
}

function getCurrentStepNumber(steps: WorkflowStep[]): number {
  for (const step of steps) {
    if (step.status !== "completed") {
      return step.order || 1;
    }
  }
  return steps.length;
}

function getNextStepId(steps: WorkflowStep[]): number {
  for (const step of steps) {
    if (step.status !== "completed") {
      return step.id;
    }
  }
  return 0;
}

// ---------- Public API ----------

export function createWorkflow(blueprint: any, idea: string = ""): CreateWorkflowResult {
  console.log("[GUIDED_WORKFLOW] Creating workflow from blueprint");

  try {
    if (!blueprint) {
      return {
        success: false,
        error: "No building plan provided",
        workflow: null,
      };
    }

    const steps = extractStepsFromBlueprint(blueprint, idea);
    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.status === "completed").length;
    const progressPercent =
      totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;

    let phases: WorkflowPhase[] = Array.isArray(blueprint?.phases)
      ? blueprint.phases.map((p: any, idx: number) => {
          const id =
            typeof p.id === "string" && p.id.trim()
              ? p.id
              : String.fromCharCode("A".charCodeAt(0) + idx);
          const stepIds: number[] = [];
          const phaseSteps = Array.isArray(p.steps) ? p.steps : [];
          for (const s of phaseSteps) {
            const match = steps.find(
              (st) =>
                st.title === s.title ||
                st.id === s.id
            );
            if (match) stepIds.push(match.id);
          }

          return {
            id,
            name: String(p.name || `Phase ${id}`),
            description: String(
              p.description || "A group of related build steps."
            ),
            steps: stepIds,
          };
        })
      : [];

    if (phases.length === 0) {
      phases = generatePhasesFromSteps(steps);
    }

    const phaseProgress = calculatePhaseProgress(phases, steps);

    const grouped = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    const phase = determineCurrentPhase(phaseProgress);

    const workflow: Workflow = {
      idea,
      app_summary:
        blueprint.app_summary ||
        blueprint.summary ||
        "Let's build something awesome!",
      summary:
        blueprint.app_summary ||
        blueprint.summary ||
        "Let's build something awesome!",
      tech_stack: blueprint.stack || blueprint.tech_stack || {},
      directory_structure:
        blueprint.directory_structure || blueprint.directories || [],
      user_flow: blueprint.user_flow || [],
      phases,
      phaseProgress = ...
      build_steps: steps,
      steps,
      grouped_steps: grouped,
      progress: {
        total: totalSteps,
        completed: completedSteps,
        percent: progressPercent,
        current_step: getCurrentStepNumber(steps),
        next_step: getNextStepId(steps),
      },
      phase,
      progress_hint:
        blueprint.progress_hint || "Follow each step to build your app!",
      testing_unlocked: progressPercent >= 70,
    };

    console.log(
      `[GUIDED_WORKFLOW] Created workflow with ${totalSteps} steps in ${phases.length} phases`
    );

    return {
      success: true,
      workflow,
    };
  } catch (err: any) {
    console.error("[GUIDED_WORKFLOW] Exception:", err);
    return {
      success: false,
      error: `Couldn't create your building plan: ${String(err).slice(0, 100)}`,
      workflow: null,
    };
  }
}

export function updateStepStatus(
  workflow: Workflow,
  stepId: number,
  newStatus: StepStatus
): { success: boolean; error?: string; workflow: Workflow } {
  try {
    const steps = workflow.build_steps || workflow.steps || [];

    for (const step of steps) {
      if (step.id === stepId) {
        step.status = newStatus;
        break;
      }
    }

    const total = steps.length;
    const completed = steps.filter((s) => s.status === "completed").length;
    const percent = total > 0 ? Math.floor((completed / total) * 100) : 0;

    workflow.build_steps = steps;
    workflow.steps = steps;
    workflow.progress = {
      total,
      completed,
      percent,
      current_step: getCurrentStepNumber(steps),
      next_step: getNextStepId(steps),
    };

    if (workflow.phases && workflow.phases.length > 0) {
      workflow.phase_progress = calculatePhaseProgress(workflow.phases, steps);
      workflow.phase = determineCurrentPhase(workflow.phase_progress);
    } else {
      workflow.phase = determinePhaseByPercent(percent);
    }

    workflow.testing_unlocked = percent >= 70;

    workflow.grouped_steps = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    return {
      success: true,
      workflow,
    };
  } catch (err: any) {
    return {
      success: false,
      error: String(err).slice(0, 100),
      workflow,
    };
  }
}

export function getStepPrompt(
  step: WorkflowStep,
  context: string = ""
): string {
  if (step.replit_prompt) return step.replit_prompt;
  return generateBuildPrompt(step, context);
}

export function getFixPrompt(
  errorMessage: string,
  step?: WorkflowStep
): string {
  let context = "";
  if (step) {
    context = `Working on: ${step.title} - ${step.why_it_matters}`;
  }
  return buildPlannerGenerateFixPrompt(errorMessage, context);
}

export function getNextStep(workflow: Workflow) {
  const steps = workflow.build_steps || workflow.steps || [];

  for (const step of steps) {
    if (step.status !== "completed") {
      return {
        success: true,
        step,
        prompt: step.replit_prompt || getStepPrompt(step, workflow.summary),
      };
    }
  }

  return {
    success: true,
    step: null,
    message:
      "All steps completed! Your app is ready for testing and publishing!",
  };
}

export function generateAllPrompts(workflow: Workflow): Record<string, string> {
  const prompts: Record<string, string> = {};
  const context = workflow.summary || "";

  const steps = workflow.build_steps || workflow.steps || [];

  for (const step of steps) {
    const id = String(step.id);
    prompts[id] = step.replit_prompt || getStepPrompt(step, context);
  }

  return prompts;
}

export function getStepDetails(step: WorkflowStep) {
  return {
    id: step.id,
    title: step.title || "Step",
    area: step.area || step.category || "feature",
    why_it_matters:
      step.why_it_matters || "This step moves your app closer to working.",
    files_to_edit: step.files_to_edit || [],
    micro_step_instructions: step.micro_step_instructions || [],
    replit_prompt: step.replit_prompt || "",
    validation_check: step.validation_check || [],
    priority: step.priority || "B",
    status: step.status || "pending",
  };
}

