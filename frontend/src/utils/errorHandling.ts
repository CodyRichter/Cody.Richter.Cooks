/**
 * Error handling utilities for API responses and form validation
 */

import { ApiError } from '@/utils/apiClient'
import { ValidationError } from '@/utils/validation'

// Extract field errors from API error response
export const extractFieldErrors = (error: ApiError): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {}

  // Check for field_errors in details
  if (error.details?.field_errors) {
    return error.details.field_errors
  }

  // Check for errors in details (alternative format)
  if (error.details?.errors) {
    return error.details.errors
  }

  return fieldErrors
}

// Convert validation errors to field error format
export const validationErrorsToFieldErrors = (errors: ValidationError[]): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {}

  errors.forEach(error => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = []
    }
    fieldErrors[error.field].push(error.message)
  })

  return fieldErrors
}

// Get user-friendly error message from API error
export const getErrorMessage = (error: ApiError): string => {
  // Check for specific error messages
  if (error.message) {
    return error.message
  }

  // Check for detail in details
  if (error.details?.detail && typeof error.details.detail === 'string') {
    return error.details.detail
  }

  // Fallback based on status code
  switch (error.status) {
    case 400:
      return 'Invalid request. Please check your input.'
    case 401:
      return 'Authentication required. Please log in.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This resource already exists or conflicts with existing data.'
    case 422:
      return 'Validation failed. Please check your input.'
    case 429:
      return 'Too many requests. Please try again later.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

// Check if error is a validation error
export const isValidationError = (error: ApiError): boolean => {
  return error.status === 422 ||
         !!error.details?.field_errors ||
         !!error.details?.errors
}

// Check if error is an authentication error
export const isAuthError = (error: ApiError): boolean => {
  return error.status === 401
}

// Check if error is an authorization error
export const isAuthorizationError = (error: ApiError): boolean => {
  return error.status === 403
}

// Check if error is retryable
export const isRetryableError = (error: ApiError): boolean => {
  return error.status >= 500 || error.status === 429
}
