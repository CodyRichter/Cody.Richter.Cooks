/**
 * API endpoint type definitions
 * These types define the request/response structure for each API endpoint
 */

import { 
  User, 
  UserCreate, 
  UserUpdate, 
  LoginRequest, 
  TokenResponse, 
  TokenRefreshRequest, 
  TokenRefreshResponse 
} from './User';
import { 
  RecipeCreate, 
  RecipeUpdate, 
  RecipeListItem, 
  RecipeSearchParams,
  RecipeDetailResponse
} from './Recipe';
import Ingredient from './Ingredient';
import InstructionStep from './InstructionStep';
import { PaginatedResponse } from './api';

// Authentication endpoints
export namespace AuthEndpoints {
  export interface Login {
    request: LoginRequest;
    response: TokenResponse;
  }

  export interface Register {
    request: UserCreate;
    response: TokenResponse;
  }

  export interface RefreshToken {
    request: TokenRefreshRequest;
    response: TokenRefreshResponse;
  }

  export interface GetProfile {
    request: void;
    response: User;
  }

  export interface UpdateProfile {
    request: UserUpdate;
    response: User;
  }

  export interface Logout {
    request: void;
    response: { message: string };
  }
}

// Recipe endpoints
export namespace RecipeEndpoints {
  export interface GetRecipes {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  }

  export interface GetRecipe {
    request: { id: string };
    response: RecipeDetailResponse;
  }

  export interface CreateRecipe {
    request: RecipeCreate;
    response: RecipeDetailResponse;
  }

  export interface UpdateRecipe {
    request: { id: string } & RecipeUpdate;
    response: RecipeDetailResponse;
  }

  export interface DeleteRecipe {
    request: { id: string };
    response: { message: string };
  }

  export interface GetMyRecipes {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  }

  export interface SearchRecipes {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  }
}

// Ingredient endpoints (if needed for standalone operations)
export namespace IngredientEndpoints {
  export interface GetIngredients {
    request: { recipe_id: string };
    response: Ingredient[];
  }

  export interface CreateIngredient {
    request: Omit<Ingredient, 'id'>;
    response: Ingredient;
  }

  export interface UpdateIngredient {
    request: { id: string } & Partial<Omit<Ingredient, 'id'>>;
    response: Ingredient;
  }

  export interface DeleteIngredient {
    request: { id: string };
    response: { message: string };
  }
}

// Instruction endpoints (if needed for standalone operations)
export namespace InstructionEndpoints {
  export interface GetInstructions {
    request: { recipe_id: string };
    response: InstructionStep[];
  }

  export interface CreateInstruction {
    request: Omit<InstructionStep, 'id'>;
    response: InstructionStep;
  }

  export interface UpdateInstruction {
    request: { id: string } & Partial<Omit<InstructionStep, 'id'>>;
    response: InstructionStep;
  }

  export interface DeleteInstruction {
    request: { id: string };
    response: { message: string };
  }
}

// System endpoints
export namespace SystemEndpoints {
  export interface HealthCheck {
    request: void;
    response: {
      status: string;
      timestamp: string;
      version?: string;
    };
  }

  export interface GetVersion {
    request: void;
    response: {
      version: string;
      build_date?: string;
      commit_hash?: string;
    };
  }
}

// Type helpers for extracting request/response types
export type EndpointRequest<T> = T extends { request: infer R } ? R : never;
export type EndpointResponse<T> = T extends { response: infer R } ? R : never;

// Union types for all endpoints
export type AuthEndpoint = 'Login' | 'Register' | 'RefreshToken' | 'GetProfile' | 'UpdateProfile';
export type RecipeEndpoint = 'GetRecipes' | 'GetRecipe' | 'CreateRecipe' | 'UpdateRecipe' | 'DeleteRecipe' | 'SearchRecipes';
export type IngredientEndpoint = 'GetIngredients' | 'GetIngredient' | 'CreateIngredient' | 'UpdateIngredient' | 'DeleteIngredient';
export type InstructionEndpoint = 'GetInstructions' | 'GetInstruction' | 'CreateInstruction' | 'UpdateInstruction' | 'DeleteInstruction';
export type SystemEndpoint = 'Health' | 'Version';

export type ApiEndpoint = 
  | `auth.${AuthEndpoint}`
  | `recipes.${RecipeEndpoint}`
  | `ingredients.${IngredientEndpoint}`
  | `instructions.${InstructionEndpoint}`
  | `system.${SystemEndpoint}`;