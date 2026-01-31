/**
 * Comprehensive error type definitions
 * These types define all possible error scenarios and their structures
 */

// Base error interface
export interface BaseError {
  message: string;
  timestamp: string;
  path?: string;
  method?: string;
}

// HTTP error response from backend
export interface HttpErrorResponse extends BaseError {
  status: number;
  error: string;
  details?: unknown;
}

// Validation error with field-specific errors
export interface ValidationErrorResponse extends BaseError {
  status: 422;
  error: 'Validation Error';
  details: {
    field_errors: Record<string, string[]>;
    body_errors?: string[];
  };
}

// Authentication error
export interface AuthErrorResponse extends BaseError {
  status: 401;
  error: 'Authentication Error';
  details?: {
    code?: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MISSING';
    requires_login?: boolean;
  };
}

// Authorization error
export interface AuthorizationErrorResponse extends BaseError {
  status: 403;
  error: 'Authorization Error';
  details?: {
    code?: 'INSUFFICIENT_PERMISSIONS' | 'RESOURCE_FORBIDDEN';
    required_permissions?: string[];
  };
}

// Not found error
export interface NotFoundErrorResponse extends BaseError {
  status: 404;
  error: 'Not Found';
  details?: {
    resource_type?: string;
    resource_id?: string;
  };
}

// Conflict error (e.g., duplicate username)
export interface ConflictErrorResponse extends BaseError {
  status: 409;
  error: 'Conflict';
  details?: {
    code?: 'DUPLICATE_RESOURCE' | 'RESOURCE_CONFLICT';
    conflicting_field?: string;
  };
}

// Rate limiting error
export interface RateLimitErrorResponse extends BaseError {
  status: 429;
  error: 'Rate Limit Exceeded';
  details?: {
    retry_after?: number;
    limit?: number;
    window?: number;
  };
}

// Server error
export interface ServerErrorResponse extends BaseError {
  status: 500 | 502 | 503 | 504;
  error: 'Internal Server Error' | 'Bad Gateway' | 'Service Unavailable' | 'Gateway Timeout';
  details?: {
    internal_code?: string;
    trace_id?: string;
  };
}

// Network error (client-side)
export interface NetworkError extends BaseError {
  type: 'network';
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'CONNECTION_REFUSED' | 'DNS_ERROR';
  retryable: boolean;
  retry_count?: number;
}

// Client-side validation error
export interface ClientValidationError extends BaseError {
  type: 'client_validation';
  field_errors: Record<string, string[]>;
}

// Union type for all possible error responses
export type ApiErrorResponse =
  | HttpErrorResponse
  | ValidationErrorResponse
  | AuthErrorResponse
  | AuthorizationErrorResponse
  | NotFoundErrorResponse
  | ConflictErrorResponse
  | RateLimitErrorResponse
  | ServerErrorResponse;

// Union type for all possible errors (including client-side)
export type AppError = ApiErrorResponse | NetworkError | ClientValidationError;

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error category for handling
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'server'
  | 'client'
  | 'unknown';

// Enhanced error with metadata
export interface EnhancedError extends BaseError {
  originalError: AppError;
  severity: ErrorSeverity;
  category: ErrorCategory;
  retryable: boolean;
  user_message: string;
  technical_message: string;
  suggested_action?: string;
  retry_count?: number;
  context?: Record<string, unknown>;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  showNotification?: boolean;
  logError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  customHandler?: (error: EnhancedError) => void;
}

// Error notification types
export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: ErrorSeverity;
  dismissible: boolean;
  auto_dismiss?: number; // milliseconds
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

// Error recovery strategies
export type ErrorRecoveryStrategy =
  | 'retry'
  | 'refresh_token'
  | 'redirect_login'
  | 'fallback_data'
  | 'offline_mode'
  | 'user_action_required';

// Error recovery context
export interface ErrorRecoveryContext {
  strategy: ErrorRecoveryStrategy;
  retryFn?: () => Promise<unknown>;
  fallbackData?: unknown;
  redirectUrl?: string;
  userActionRequired?: {
    title: string;
    message: string;
    actions: Array<{
      label: string;
      action: () => void;
    }>;
  };
}
