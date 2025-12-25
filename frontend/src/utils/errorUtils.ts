import { ApiError } from './apiClient';

export interface ErrorInfo {
  isNotFound: boolean;
  isForbidden: boolean;
  isUnauthorized: boolean;
  isServerError: boolean;
  isNetworkError: boolean;
  message: string;
  shouldShowRetry: boolean;
}

export function analyzeError(error: ApiError | Error | null): ErrorInfo {
  if (!error) {
    return {
      isNotFound: false,
      isForbidden: false,
      isUnauthorized: false,
      isServerError: false,
      isNetworkError: false,
      message: '',
      shouldShowRetry: false
    };
  }

  const isApiError = (err: ApiError | Error | null): err is ApiError => {
    return err !== null && 'status' in err;
  };

  const apiError = isApiError(error) ? error : null;
  const status = apiError?.status;

  const isNotFound = status === 404;
  const isForbidden = status === 403;
  const isUnauthorized = status === 401;
  const isServerError = status ? status >= 500 : false;
  const isNetworkError = !status && error !== null;

  const getMessage = () => {
    if (isNotFound) return 'Resource not found';
    if (isForbidden) return 'Access denied';
    if (isUnauthorized) return 'Authentication required';
    if (isServerError) return 'Server error occurred';
    if (isNetworkError) return 'Network connection error';

    return apiError?.message || error.message || 'An error occurred';
  };

  const shouldShowRetry = () => {
    // Don't show retry for client errors (4xx except 401)
    if (status && status >= 400 && status < 500 && status !== 401) {
      return false;
    }
    return true;
  };

  return {
    isNotFound,
    isForbidden,
    isUnauthorized,
    isServerError,
    isNetworkError,
    message: getMessage(),
    shouldShowRetry: shouldShowRetry()
  };
}

export function getErrorMessage(error: ApiError | Error | null): string {
  return analyzeError(error).message;
}

export function shouldRetryError(error: ApiError | Error | null): boolean {
  return analyzeError(error).shouldShowRetry;
}
