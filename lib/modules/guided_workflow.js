// lib/modules/guided_workflow.js

// NOTE: we removed the build_planner import for now to avoid extra module issues.
// If you really want to wire that back later, we can do it safely once
// everything is running.

//
// Helper: priority mapping
//
function areaToPriority(area) {
  const map = {
    frontend: "A",
    backend: "A",
    database: "A",
    ai_logic: "B",
    integration: "B",
    ux: "C",
  };
  return map[area] || "B";
}

function getPhaseEmoji(id) {
  const emojis = {
    A: "🏗️",
    B: "💾",
    C: "📁",
    D: "🤖",
    E: "📱",
    F: "📚",
    G: "✨",
  };
  return emojis[id] || "🔨";
}

function getPhaseEncouragement(phaseId, percent) {
  if (percent === 0) return "Let's get started!";
  if (percent < 50) return "Great progress—keep going!";
  if (percent < 100) return "Almost done with this phase!";
  return "Phase complete!";
}

function determinePhaseByPercent(percent) {
  if (percent < 30) {
    return {
      name: "Foundation",
      id: "A",
      description: "Setting up the basics!",
      emoji: "🏗️",
      percent,
      encouragement: "Great start!",
    };
  }

  if (percent < 70) {
    return {
      name: "Building",
      id: "B",
      description: "Adding the main features!",
      emoji: "🔨",
      percent,
      encouragement: "You're doing amazing!",
    };
  }

  if (percent < 100) {
    return {
      name: "Polish",
      id: "G",
      description: "Making it perfect!",
      emoji: "✨",
      percent,
      encouragement: "So close!",
    };
  }

  return {
    name: "Complete",
    id: "Z",
    description: "Your app is ready!",
    emoji: "🚀",
    percent: 100,
    encouragement: "Congratulations!",
  };
}

function generateBuildPrompt(step, context = "") {
  const ctx = (context || "").slice(0, 200);
  const why = step.why_it_matters || "";

  const notes = [
    `You are helping build: ${ctx || "an app"}`,
    `Current step: ${step.title}`,
    `Why this matters: ${why}`,
    `Area: ${step.area} (${step.category}), priority ${step.priority}`,
  ];

  if (step.files_to_edit && step.files_to_edit.length) {
    notes.push("Files: " + step.files_to_edit.join(", "));
  }

  if (step.micro_step_instructions && step.micro_step_instructions.length) {
    notes.push("Follow micro-steps:");
    step.micro_step_instructions.forEach((m, i) => {
      notes.push(`${i + 1}. ${m}`);
    });
  }

  notes.push("");
  notes.push("Rules:");
  notes.push("- Only do the required change.");
  notes.push("- Keep code simple.");

  return notes.join("\n");
}

//
// Step extraction
//
function generateFallbackSteps(idea) {
  const shortIdea = (idea || "").slice(0, 80);

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
      replit_prompt: `Create a minimal backend for: ${shortIdea}`,
      validation_check: ["Server runs", "Endpoint works"],
      priority: "A",
      status: "pending",
      estimated_minutes: 20,
      difficulty: "easy",
    },
  ];
}

function extractStepsFromBlueprint(blueprint, idea) {
  const phases = Array.isArray(blueprint?.phases) ? blueprint.phases : [];
  const results = [];
  let idCounter = 1;

  if (!phases.length) {
    return generateFallbackSteps(idea);
  }

  for (const p of phases) {
    for (const s of p.steps || []) {
      const area = String(s.area || s.category || "feature").toLowerCase();
      const priority = areaToPriority(area);

      const step = {
        id: idCounter,
        order: idCounter,
        title: String(s.title || `Step ${idCounter}`),
        area,
        category: s.category || area,
        why_it_matters:
          s.why_it_matters ||
          s.reason ||
          "This step moves the app forward.",
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

function generatePhasesFromSteps(steps) {
  const map = {};

  const areaMap = {
    backend: ["A", "Phase A – Foundation", "Setting up backend basics"],
    frontend: ["A", "Phase A – Foundation", "Setting up UI"],
    database: ["B", "Phase B – Data", "Adding persistent storage"],
    ai_logic: ["D", "Phase D – AI", "Building AI logic"],
    integration: ["E", "Phase E – Integration", "Connecting everything"],
    ux: ["G", "Phase G – Polish", "Making it smooth"],
  };

  for (const step of steps) {
    const tuple = areaMap[step.area] || [
      "B",
      "Phase B – Build",
      "Feature building",
    ];
    const [id, name, desc] = tuple;

    if (!map[id]) {
      map[id] = { id, name, description: desc, steps: [] };
    }
    map[id].steps.push(step.id);
  }

  return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
}

function calculatePhaseProgress(phases, steps) {
  const statusById = {};
  for (const s of steps) statusById[s.id] = s.status;

  return phases.map((p) => {
    const total = p.steps.length;
    const completed = p.steps.filter((id) => statusById[id] === "completed")
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

//
// MAIN: createWorkflow
//
export function createWorkflow(blueprint, idea = "") {
  try {
    const steps = extractStepsFromBlueprint(blueprint, idea);
    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.status === "completed").length;

    const progressPercent =
      totalSteps > 0
        ? Math.floor((completedSteps / totalSteps) * 100)
        : 0;

    let phases = Array.isArray(blueprint?.phases)
      ? blueprint.phases.map((p, idx) => {
          const id =
            typeof p.id === "string" && p.id.trim()
              ? p.id
              : String.fromCharCode("A".charCodeAt(0) + idx);

          const stepIds = [];
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

    if (!phases.length) {
      phases = generatePhasesFromSteps(steps);
    }

    const phaseProgress = calculatePhaseProgress(phases, steps);

    const phase = (() => {
      for (const p of phaseProgress) {
        if (p.status !== "completed") {
          return {
            name: p.name,
            id: p.id,
            description: p.description,
            emoji: getPhaseEmoji(p.id),
            percent: p.percent,
            encouragement: getPhaseEncouragement(p.id, p.percent),
          };
        }
      }
      return determinePhaseByPercent(100);
    })();

    const grouped = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    const workflow = {
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
  } catch (err) {
    return {
      success: false,
      workflow: null,
      error: String(err).slice(0, 100),
    };
  }
}

//
// UTILITIES
//
export function updateStepStatus(workflow, stepId, newStatus) {
  try {
    const steps = workflow.build_steps || [];

    for (const step of steps) {
      if (step.id === stepId) {
        step.status = newStatus;
        break;
      }
    }

    const total = steps.length;
    const completed = steps.filter((s) => s.status === "completed").length;
    const percent = total ? Math.floor((completed / total) * 100) : 0;

    workflow.build_steps = steps;
    workflow.steps = steps;

    workflow.progress = {
      total,
      completed,
      percent,
      current_step: steps.find((s) => s.status !== "completed")?.order || 1,
      next_step: steps.find((s) => s.status !== "completed")?.id || 0,
    };

    workflow.phase_progress = calculatePhaseProgress(
      workflow.phases || [],
      steps
    );

    workflow.phase = determinePhaseByPercent(percent);
    workflow.testing_unlocked = percent >= 70;

    workflow.grouped_steps = {
      A: steps.filter((s) => s.priority === "A"),
      B: steps.filter((s) => s.priority === "B"),
      C: steps.filter((s) => s.priority === "C"),
    };

    return { success: true, workflow };
  } catch (err) {
    return {
      success: false,
      error: String(err).slice(0, 100),
      workflow,
    };
  }
}

export function getStepPrompt(step, context = "") {
  return step.replit_prompt || generateBuildPrompt(step, context);
}

// Simple generic fix prompt (no build_planner dependency for now)
export function getFixPrompt(errorMessage, step) {
  const context = step
    ? `Working on: ${step.title} - ${step.why_it_matters}`
    : "";
  return [
    "You are an expert developer helping debug a build-step in a workflow.",
    context && `Context: ${context}`,
    "",
    "The user saw this error:",
    errorMessage,
    "",
    "Explain clearly what went wrong and give concrete steps to fix it.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getNextStep(workflow) {
  for (const step of workflow.build_steps || []) {
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

export function generateAllPrompts(workflow) {
  const prompts = {};
  const context = workflow.summary || "";

  for (const step of workflow.build_steps || []) {
    prompts[String(step.id)] =
      step.replit_prompt || generateBuildPrompt(step, context);
  }

  return prompts;
}

export function getStepDetails(step) {
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




