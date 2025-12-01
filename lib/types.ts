// lib/types.ts

export interface URLRequest {
  url: string;
}

export interface IdeaRequest {
  idea: string;
}

export interface WorkflowUpdateRequest {
  workflow: Record<string, unknown>;
  step_id: number;
  status: string;
}

export interface FixErrorRequest {
  error_message: string;
  context?: string;
}

export interface PromptRequest {
  step: Record<string, unknown>;
  context?: string;
}

