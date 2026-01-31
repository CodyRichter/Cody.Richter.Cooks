// JWT-based authentication utilities
import { tokenStorageKey, refreshTokenStorageKey } from '@/config/environment'

export const authConfig = {
  tokenStorageKey,
  refreshTokenStorageKey
}

// Utility functions for token management
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(authConfig.tokenStorageKey)
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(authConfig.refreshTokenStorageKey)
}

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(authConfig.tokenStorageKey, accessToken)
  localStorage.setItem(authConfig.refreshTokenStorageKey, refreshToken)
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(authConfig.tokenStorageKey)
  localStorage.removeItem(authConfig.refreshTokenStorageKey)
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    const thresholdSeconds = thresholdMinutes * 60
    return (payload.exp - currentTime) <= thresholdSeconds
  } catch {
    return true
  }
}
