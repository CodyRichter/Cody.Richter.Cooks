import { Ingredient } from "@/types/Ingredient";
import { InstructionStep } from "@/types/InstructionStep";
import { RecipeDetail } from "@/types/Recipe";

/**
 * Converts a decimal number to a fractional representation and returns it as a string.
 * @param decimal Decimal number to convert to a fraction
 * @returns
 */
export function convertToFractionalRepresentation(candidate: number): string {
  const maxDenominator = 10; // Maximum denominator to use for the fraction

  // If the candidate is greater than 1, we remove the integer part and only keep the decimal part.
  // We will add the integer part back to the fraction later.

  const prefix = Math.floor(candidate);
  const decimal = candidate - Math.floor(candidate);

  // If there is no decimal part, return the integer part as a string
  if (decimal === 0) {
    return prefix.toString();
  }

  let closestDifference = Infinity;
  let closestNumerator = 0;
  let closestDenominator = 1;
  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(decimal * denominator);
    const fraction = numerator / denominator;
    const difference = Math.abs(decimal - fraction);

    if (difference < closestDifference) {
      closestDifference = difference;
      closestNumerator = numerator;
      closestDenominator = denominator;
    }
  }

  // Reconstruct the fraction string and add the prefix if necessary
  const fractionString = `${closestNumerator}/${closestDenominator}`;

  if (closestNumerator === 0 && closestDenominator === 1 && prefix > 0) {
    // If the closest fraction is 0/1, we return only the prefix
    // This means that the decimal part was very small and rounded to 0
    return prefix.toString();
  } else if (closestNumerator === 0 && closestDenominator === 1) {
    // If the closest fraction is 0/1 and there is no prefix, return "0"
    return "Barely any";
  }

  return prefix === 0 ? fractionString : `${prefix} and ${fractionString}`;
}

/**
 * Converts a string to title case.
 * @param str The string to convert to title case
 * @returns The title-cased string
 */
export function titleize(str: string): string {
  return str
    .toLowerCase()
    .replaceAll(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface RecipeValidationStatus {
  isValid: boolean;
  completionCount: number;
  totalCount: number;
  titleValid: boolean;
  descriptionValid: boolean;
  ingredientsValid: boolean;
  instructionsValid: boolean;
  issues: string[];
}

/**
 * Evaluates the validation state of a recipe and returns detailed progress information.
 * @param recipe The recipe to check
 * @returns RecipeValidationStatus object
 */
export function getRecipeValidationStatus(recipe: RecipeDetail): RecipeValidationStatus {
  if (!recipe) {
    return {
      isValid: false,
      completionCount: 0,
      totalCount: 4,
      titleValid: false,
      descriptionValid: false,
      ingredientsValid: false,
      instructionsValid: false,
      issues: ["Recipe data is missing"],
    };
  }

  const issues: string[] = [];

  const titleValid = !!recipe.title && recipe.title.trim().length >= 3;
  if (!titleValid) {
    issues.push("Recipe title (min 3 characters)");
  }

  const strippedDescription = (recipe.description || "")
    .replace(/<[^>]*>/g, "")
    .trim();
  const descriptionValid = !!recipe.description && strippedDescription.length > 0;
  if (!descriptionValid) {
    issues.push("Short description / story");
  }

  const hasIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0;
  const ingredientsComplete =
    hasIngredients &&
    recipe.ingredients.every(
      (ing: Ingredient) => !!ing.name?.trim() && ing.quantity > 0 && !!ing.unit?.trim()
    );
  const ingredientsValid = hasIngredients && ingredientsComplete;
  if (!hasIngredients) {
    issues.push("At least 1 ingredient");
  } else if (!ingredientsComplete) {
    issues.push("All ingredients require a quantity, unit, and name");
  }

  const hasInstructions = Array.isArray(recipe.instructions) && recipe.instructions.length > 0;
  const instructionsComplete =
    hasInstructions &&
    recipe.instructions.every(
      (inst: InstructionStep) => {
        const strippedInstDesc = (inst.description || "").replace(/<[^>]*>/g, "").trim();
        return !!inst.title?.trim() && (!!inst.description?.trim() && strippedInstDesc.length > 0);
      }
    );
  const instructionsValid = hasInstructions && instructionsComplete;
  if (!hasInstructions) {
    issues.push("At least 1 instruction step");
  } else if (!instructionsComplete) {
    issues.push("All steps require a step title and description");
  }

  const completionCount =
    (titleValid ? 1 : 0) +
    (descriptionValid ? 1 : 0) +
    (ingredientsValid ? 1 : 0) +
    (instructionsValid ? 1 : 0);

  const isValid =
    titleValid && descriptionValid && ingredientsValid && instructionsValid;

  return {
    isValid,
    completionCount,
    totalCount: 4,
    titleValid,
    descriptionValid,
    ingredientsValid,
    instructionsValid,
    issues,
  };
}

/**
 * Checks if a recipe is valid.
 * @param recipe The recipe to check
 * @returns True if the recipe is valid, false otherwise
 */
export function isRecipeValid(recipe: RecipeDetail): boolean {
  return getRecipeValidationStatus(recipe).isValid;
}
