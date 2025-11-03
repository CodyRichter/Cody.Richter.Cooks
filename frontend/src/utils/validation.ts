/**
 * Form validation utilities matching backend validation rules
 */

import { 
  RecipeCreate, 
  RecipeUpdate, 
  IngredientForRecipe, 
  InstructionForRecipe 
} from '../types/Recipe'
import { UserCreate, UserUpdate } from '../types/User'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Recipe validation
export const validateRecipeCreate = (recipe: RecipeCreate): ValidationResult => {
  const errors: ValidationError[] = []

  // Title validation (required, 1-255 chars)
  if (!recipe.title || recipe.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Recipe title is required' })
  } else if (recipe.title.length > 255) {
    errors.push({ field: 'title', message: 'Recipe title must be 255 characters or less' })
  }

  // Cooking time validation (optional, >= 1)
  if (recipe.cooking_time !== undefined && recipe.cooking_time < 1) {
    errors.push({ field: 'cooking_time', message: 'Cooking time must be at least 1 minute' })
  }

  // Serving size validation (optional, >= 1)
  if (recipe.serving_size !== undefined && recipe.serving_size < 1) {
    errors.push({ field: 'serving_size', message: 'Serving size must be at least 1' })
  }

  // Validate ingredients
  recipe.ingredients.forEach((ingredient, index) => {
    const ingredientErrors = validateIngredient(ingredient)
    ingredientErrors.errors.forEach(error => {
      errors.push({ 
        field: `ingredients.${index}.${error.field}`, 
        message: error.message 
      })
    })
  })

  // Validate instructions
  recipe.instructions.forEach((instruction, index) => {
    const instructionErrors = validateInstruction(instruction)
    instructionErrors.errors.forEach(error => {
      errors.push({ 
        field: `instructions.${index}.${error.field}`, 
        message: error.message 
      })
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateRecipeUpdate = (recipe: RecipeUpdate): ValidationResult => {
  const errors: ValidationError[] = []

  // Title validation (optional, 1-255 chars if provided)
  if (recipe.title !== undefined) {
    if (recipe.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Recipe title cannot be empty' })
    } else if (recipe.title.length > 255) {
      errors.push({ field: 'title', message: 'Recipe title must be 255 characters or less' })
    }
  }

  // Cooking time validation (optional, >= 1 if provided)
  if (recipe.cooking_time !== undefined && recipe.cooking_time < 1) {
    errors.push({ field: 'cooking_time', message: 'Cooking time must be at least 1 minute' })
  }

  // Serving size validation (optional, >= 1 if provided)
  if (recipe.serving_size !== undefined && recipe.serving_size < 1) {
    errors.push({ field: 'serving_size', message: 'Serving size must be at least 1' })
  }

  // Validate ingredients if provided
  if (recipe.ingredients) {
    recipe.ingredients.forEach((ingredient, index) => {
      const ingredientErrors = validateIngredient(ingredient)
      ingredientErrors.errors.forEach(error => {
        errors.push({ 
          field: `ingredients.${index}.${error.field}`, 
          message: error.message 
        })
      })
    })
  }

  // Validate instructions if provided
  if (recipe.instructions) {
    recipe.instructions.forEach((instruction, index) => {
      const instructionErrors = validateInstruction(instruction)
      instructionErrors.errors.forEach(error => {
        errors.push({ 
          field: `instructions.${index}.${error.field}`, 
          message: error.message 
        })
      })
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Ingredient validation
export const validateIngredient = (ingredient: IngredientForRecipe): ValidationResult => {
  const errors: ValidationError[] = []

  // Name validation (required, 1-255 chars)
  if (!ingredient.name || ingredient.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Ingredient name is required' })
  } else if (ingredient.name.length > 255) {
    errors.push({ field: 'name', message: 'Ingredient name must be 255 characters or less' })
  }

  // Quantity validation (required, >= 0)
  if (ingredient.quantity < 0) {
    errors.push({ field: 'quantity', message: 'Ingredient quantity cannot be negative' })
  }

  // Unit validation (required, 1-50 chars)
  if (!ingredient.unit || ingredient.unit.trim().length === 0) {
    errors.push({ field: 'unit', message: 'Ingredient unit is required' })
  } else if (ingredient.unit.length > 50) {
    errors.push({ field: 'unit', message: 'Ingredient unit must be 50 characters or less' })
  }

  // Subtext validation (optional, max 255 chars)
  if (ingredient.subtext && ingredient.subtext.length > 255) {
    errors.push({ field: 'subtext', message: 'Ingredient subtext must be 255 characters or less' })
  }

  // Order index validation (required, >= 0)
  if (ingredient.order_index < 0) {
    errors.push({ field: 'order_index', message: 'Ingredient order index cannot be negative' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Instruction validation
export const validateInstruction = (instruction: InstructionForRecipe): ValidationResult => {
  const errors: ValidationError[] = []

  // Title validation (required, 1-255 chars)
  if (!instruction.title || instruction.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Instruction title is required' })
  } else if (instruction.title.length > 255) {
    errors.push({ field: 'title', message: 'Instruction title must be 255 characters or less' })
  }

  // Description validation (required, min 1 char)
  if (!instruction.description || instruction.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Instruction description is required' })
  }

  // Step number validation (required, >= 1)
  if (instruction.step_number < 1) {
    errors.push({ field: 'step_number', message: 'Instruction step number must be at least 1' })
  }

  // Timing validation (optional, >= 1 if provided)
  if (instruction.timing !== undefined && instruction.timing < 1) {
    errors.push({ field: 'timing', message: 'Instruction timing must be at least 1 minute' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// User validation
export const validateUserCreate = (user: UserCreate): ValidationResult => {
  const errors: ValidationError[] = []

  // Username validation (required, 3-50 chars)
  if (!user.username || user.username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' })
  } else if (user.username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' })
  } else if (user.username.length > 50) {
    errors.push({ field: 'username', message: 'Username must be 50 characters or less' })
  }

  // Email validation (required, valid email format)
  if (!user.email || user.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Password validation (required, 8-128 chars)
  if (!user.password || user.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (user.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
  } else if (user.password.length > 128) {
    errors.push({ field: 'password', message: 'Password must be 128 characters or less' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUserUpdate = (user: UserUpdate): ValidationResult => {
  const errors: ValidationError[] = []

  // Username validation (optional, 3-50 chars if provided)
  if (user.username !== undefined) {
    if (user.username.trim().length === 0) {
      errors.push({ field: 'username', message: 'Username cannot be empty' })
    } else if (user.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters' })
    } else if (user.username.length > 50) {
      errors.push({ field: 'username', message: 'Username must be 50 characters or less' })
    }
  }

  // Email validation (optional, valid email format if provided)
  if (user.email !== undefined) {
    if (user.email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email cannot be empty' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' })
    }
  }

  // Password validation (optional, 8-128 chars if provided)
  if (user.password !== undefined) {
    if (user.password.length === 0) {
      errors.push({ field: 'password', message: 'Password cannot be empty' })
    } else if (user.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
    } else if (user.password.length > 128) {
      errors.push({ field: 'password', message: 'Password must be 128 characters or less' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// HTML content validation (basic)
export const validateHtmlContent = (content: string, allowedTags: string[] = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'img', 'a', 'span', 'div', 'blockquote'
]): ValidationResult => {
  const errors: ValidationError[] = []

  if (!content) {
    return { isValid: true, errors: [] }
  }

  // Simple regex to find HTML tags
  const tagPattern = /<\/?(\w+)[^>]*>/g
  const matches = content.matchAll(tagPattern)
  
  for (const match of matches) {
    const tag = match[1].toLowerCase()
    if (!allowedTags.includes(tag)) {
      errors.push({ 
        field: 'content', 
        message: `HTML tag '${tag}' is not allowed` 
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}