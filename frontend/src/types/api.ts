/**
 * API request/response type definitions
 * These types define the structure of API requests and responses
 */

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status: number;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Error response types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  type: 'validation';
  field_errors: Record<string, string[]>;
}

export interface AuthenticationError extends ApiError {
  type: 'authentication';
  requires_login: boolean;
}

export interface NetworkError extends ApiError {
  type: 'network';
  retryable: boolean;
  retry_count: number;
}

export interface ServerError extends ApiError {
  type: 'server';
  internal_code?: string;
}

// Union type for all possible errors
export type ApiErrorType = ValidationError | AuthenticationError | NetworkError | ServerError;

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

// Cache configuration
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  enabled?: boolean;
}

// API client request options
export interface ApiRequestOptions extends RequestConfig {
  cache?: CacheConfig;
  skipAuth?: boolean; // Skip automatic token attachment
  skipErrorHandling?: boolean; // Skip global error handling
}