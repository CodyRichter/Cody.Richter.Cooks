/**
 * Central export file for all TypeScript types
 */

// Core entity types
export type { User } from './User';
export type { default as Recipe } from './Recipe';
export type { default as Ingredient } from './Ingredient';
export type { default as InstructionStep } from './InstructionStep';

// User types
export type {
  UserCreate,
  UserUpdate,
  LoginRequest,
  TokenResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserRegistration, // Legacy compatibility
} from './User';

// Recipe types
export type {
  RecipeDetail,
  RecipeListItem,
  IngredientForRecipe,
  InstructionForRecipe,
  RecipeCreate,
  RecipeUpdate,
  RecipeResponse,
  RecipeDetailResponse,
  RecipeSearchParams,
} from './Recipe';

// Permission types
export type {
  PermissionRole,
  RecipePermissionBase,
  RecipePermissionCreate,
  RecipePermissionUpdate,
  RecipePermissionResponse,
  RecipePermissionWithUser,
  RecipePermissionWithRecipe,
  GrantPermissionRequest,
  RevokePermissionRequest,
  UserRecipePermissions
} from './Permission';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  ServerError,
  ApiErrorType,
  HttpMethod,
  RequestConfig,
  CacheConfig,
  ApiRequestOptions,
} from './api';

// Endpoint types
export type {
  AuthEndpoints,
  RecipeEndpoints,
  IngredientEndpoints,
  InstructionEndpoints,
  SystemEndpoints,
  EndpointRequest,
  EndpointResponse,
  AuthEndpoint,
  RecipeEndpoint,
  IngredientEndpoint,
  InstructionEndpoint,
  SystemEndpoint,
  ApiEndpoint,
} from './endpoints';

// Validation types
export type {
  ValidationRule,
  ValidationSchema,
  ValidationResult,
  FieldError,
  FormValidationState,
  HtmlValidationOptions,
} from './validation';

export {
  UserValidationSchemas,
  RecipeValidationSchemas,
  IngredientValidationSchema,
  InstructionValidationSchema,
  DefaultHtmlValidationOptions,
  SearchValidationSchema,
} from './validation';

// Error types
export type {
  BaseError,
  HttpErrorResponse,
  ValidationErrorResponse,
  AuthErrorResponse,
  AuthorizationErrorResponse,
  NotFoundErrorResponse,
  ConflictErrorResponse,
  RateLimitErrorResponse,
  ServerErrorResponse,
  ClientValidationError,
  ApiErrorResponse,
  AppError,
  ErrorSeverity,
  ErrorCategory,
  EnhancedError,
  ErrorHandlerConfig,
  ErrorNotification,
  ErrorRecoveryStrategy,
  ErrorRecoveryContext,
} from './errors';

// Constants
export * from './constants';