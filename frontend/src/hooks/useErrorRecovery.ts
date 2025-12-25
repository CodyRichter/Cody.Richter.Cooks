import { useCallback } from 'react'
import { ApiError } from '../utils/apiClient'

// Simple retry hook for manual retries
export const useRetry = () => {
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: ApiError | Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as ApiError | Error

        // Don't retry on client errors (4xx except 401, 408, 429)
        if (lastError && typeof lastError === 'object' && 'status' in lastError && 'timestamp' in lastError) {
          const apiError = lastError as ApiError
          if (apiError.status >= 400 && apiError.status < 500) {
            if (![401, 408, 429].includes(apiError.status)) {
              throw lastError
            }
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }

    throw lastError!
  }, [])

  return { retry }
}
