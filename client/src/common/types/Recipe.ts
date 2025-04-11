import Ingredient from "./Ingredient";
import InstructionStep from "./InstructionStep";

export default interface Recipe {
  id: string;
  title: string;
  description: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: InstructionStep[];
}
