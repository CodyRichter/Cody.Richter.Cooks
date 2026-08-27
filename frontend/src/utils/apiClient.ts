import { apiBaseUrl, tokenStorageKey, refreshTokenStorageKey } from '@/config/environment'

export class ApiError extends Error {
  status: number
  code?: string
  details?: {
    field_errors?: Record<string, string[]>
    errors?: Record<string, string[]>
    [key: string]: unknown
  } | null
  timestamp: string

  constructor(
    message: string,
    status: number,
    code?: string,
    details: unknown = null,
    timestamp: string = new Date().toISOString()
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details as ApiError['details']
    this.timestamp = timestamp

    // Ensure the prototype is set correctly for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

// Simple token manager
class TokenManager {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(tokenStorageKey)
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(refreshTokenStorageKey)
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(tokenStorageKey, accessToken)
    if (refreshToken) {
      localStorage.setItem(refreshTokenStorageKey, refreshToken)
    }
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(tokenStorageKey)
    localStorage.removeItem(refreshTokenStorageKey)
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/users/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      this.clearTokens()
      let message = 'Failed to refresh token'
      let details = null
      try {
        const errorData = await response.json()
        message = errorData.message || errorData.detail || message
        details = errorData
      } catch {
        // Use status text if JSON parsing fails
        message = response.statusText || message
      }
      throw new ApiError(message, response.status, response.status.toString(), details)
    }

    const data = await response.json()
    this.setTokens(data.access_token, data.refresh_token)
    return data.access_token
  }
}

// Simple API client for React Query
export class ApiClient {
  private tokenManager = new TokenManager()
  private baseUrl = apiBaseUrl

  private async createApiError(response: Response): Promise<ApiError> {
    let message = 'An error occurred'
    let details: Record<string, unknown> | null = null

    try {
      const errorData = await response.json()
      details = errorData

      // Try to extract a meaningful string message
      if (typeof errorData.message === 'string') {
        message = errorData.message
      } else if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        // Handle nested detail object (e.g. { detail: { message: "..." } })
        message = errorData.detail.message || errorData.detail.error || message
      }
    } catch {
      message = response.statusText || message
    }

    return new ApiError(
      message,
      response.status,
      response.status.toString(),
      details
    )
  }

  private getHeaders(skipAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (!skipAuth) {
      const token = this.tokenManager.getAccessToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  async request<T>(endpoint: string, options: RequestInit & { skipAuth?: boolean } = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options

    // Ensure endpoint starts with / and ends with / (unless it's empty or already has it)
    let processedEndpoint = endpoint
    if (!processedEndpoint.startsWith('/')) {
      processedEndpoint = `/${processedEndpoint}`
    }

    // Split query params to handle trailing slash on the path part
    const [path, query] = processedEndpoint.split('?')
    const finalPath = path.endsWith('/') ? path : `${path}/`
    const finalEndpoint = query ? `${finalPath}?${query}` : finalPath

    const url = `${this.baseUrl}${finalEndpoint}`

    let response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(skipAuth),
        ...fetchOptions.headers
      }
    })

    // Handle 401 with token refresh
    if (response.status === 401 && !skipAuth) {
      try {
        await this.tokenManager.refreshAccessToken()
        response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...this.getHeaders(false),
            ...fetchOptions.headers
          }
        })
      } catch {
        this.tokenManager.clearTokens()
        throw new Error('Authentication failed. Please log in again.')
      }
    }

    if (!response.ok) {
      throw await this.createApiError(response)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // Convenience methods
  get<T>(endpoint: string, skipAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', skipAuth })
  }

  post<T>(endpoint: string, data?: unknown, skipAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      skipAuth
    })
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
