export interface InstructionStep {
  id: string;
  title: string;
  description: string;
  step_number: number;
  timing?: number;
  recipe_id: string;
}

export interface InstructionCreate {
  title?: string;
  description: string;
  step_number?: number;
  timing?: number;
}

export interface InstructionPatch {
  title?: string;
  description?: string;
  step_number?: number;
  timing?: number;
}
