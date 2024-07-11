import Ingredient from "./Ingredient";
import InstructionStep from "./InstructionStep";

export default interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
}
