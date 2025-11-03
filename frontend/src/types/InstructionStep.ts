export default interface InstructionStep {
  id: string;
  title: string;
  description: string;
  step_number: number;
  timing?: number;
  recipe_id: string;
}
