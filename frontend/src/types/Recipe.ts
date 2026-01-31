import { Ingredient } from "@/types/Ingredient";
import { InstructionStep } from "@/types/InstructionStep";

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  cooking_time?: number;
  serving_size?: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: Ingredient[];
  instructions: InstructionStep[];
}

// Recipe list item for summary views (matches backend RecipeListItem)
export interface RecipeListItem {
  id: string;
  title: string;
  cooking_time?: number;
  serving_size?: number;
  created_at: string;
}

// Ingredient data for recipe creation/update (without id and recipe_id)
export interface IngredientForRecipe {
  name: string;
  quantity: number;
  unit: string;
  subtext?: string;
  order_index: number;
}

// Instruction data for recipe creation/update (without id and recipe_id)
export interface InstructionForRecipe {
  title: string;
  description: string;
  step_number: number;
  timing?: number;
}

export interface RecipeCreate {
  title: string;
  description?: string;
  tags?: string[];
  cooking_time?: number;
  serving_size?: number;
  ingredients: IngredientForRecipe[];
  instructions: InstructionForRecipe[];
}

export interface RecipeUpdate {
  title?: string;
  description?: string;
  tags?: string[];
  cooking_time?: number;
  serving_size?: number;
  ingredients?: IngredientForRecipe[];
  instructions?: InstructionForRecipe[];
}

// Recipe response interfaces matching backend schemas
export type RecipeResponse = Recipe

export type RecipeDetailResponse = RecipeDetail

// Search parameters matching backend RecipeSearchParams
export interface RecipeSearchParams {
  q?: string;
  page?: number;
  limit?: number;
}
