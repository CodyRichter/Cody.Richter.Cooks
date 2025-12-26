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
} from '@/types/User';
import {
  RecipeCreate,
  RecipeUpdate,
  RecipeListItem,
  RecipeSearchParams,
  RecipeDetailResponse
} from '@/types/Recipe';
import { Ingredient } from '@/types/Ingredient';
import { InstructionStep } from '@/types/InstructionStep';
import { PaginatedResponse } from '@/types/api';

// Authentication endpoints
export type AuthEndpoints = {
  Login: {
    request: LoginRequest;
    response: TokenResponse;
  };

  Register: {
    request: UserCreate;
    response: TokenResponse;
  };

  RefreshToken: {
    request: TokenRefreshRequest;
    response: TokenRefreshResponse;
  };

  GetProfile: {
    request: void;
    response: User;
  };

  UpdateProfile: {
    request: UserUpdate;
    response: User;
  };

  Logout: {
    request: void;
    response: { message: string };
  };
};

// Recipe endpoints
export type RecipeEndpoints = {
  GetRecipes: {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  };

  GetRecipe: {
    request: { id: string };
    response: RecipeDetailResponse;
  };

  CreateRecipe: {
    request: RecipeCreate;
    response: RecipeDetailResponse;
  };

  UpdateRecipe: {
    request: { id: string } & RecipeUpdate;
    response: RecipeDetailResponse;
  };

  DeleteRecipe: {
    request: { id: string };
    response: { message: string };
  };

  GetMyRecipes: {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  };

  SearchRecipes: {
    request: RecipeSearchParams;
    response: PaginatedResponse<RecipeListItem>;
  };
};

// Ingredient endpoints (if needed for standalone operations)
export type IngredientEndpoints = {
  GetIngredients: {
    request: { recipe_id: string };
    response: Ingredient[];
  };

  CreateIngredient: {
    request: Omit<Ingredient, 'id'>;
    response: Ingredient;
  };

  UpdateIngredient: {
    request: { id: string } & Partial<Omit<Ingredient, 'id'>>;
    response: Ingredient;
  };

  DeleteIngredient: {
    request: { id: string };
    response: { message: string };
  };
};

// Instruction endpoints (if needed for standalone operations)
export type InstructionEndpoints = {
  GetInstructions: {
    request: { recipe_id: string };
    response: InstructionStep[];
  };

  CreateInstruction: {
    request: Omit<InstructionStep, 'id'>;
    response: InstructionStep;
  };

  UpdateInstruction: {
    request: { id: string } & Partial<Omit<InstructionStep, 'id'>>;
    response: InstructionStep;
  };

  DeleteInstruction: {
    request: { id: string };
    response: { message: string };
  };
};

// System endpoints
export type SystemEndpoints = {
  HealthCheck: {
    request: void;
    response: {
      status: string;
      timestamp: string;
      version?: string;
    };
  };

  GetVersion: {
    request: void;
    response: {
      version: string;
      build_date?: string;
      commit_hash?: string;
    };
  };
};

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
