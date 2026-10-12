// Session storage: the single source of truth for tokens and the cached user in localStorage
import { tokenStorageKey, refreshTokenStorageKey, userStorageKey } from '@/config/environment'
import type { User } from '@/types/User'

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(tokenStorageKey)
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(refreshTokenStorageKey)
}

/**
 * What this browser knows about the session without asking the server:
 * a cached `User`, `'pending'` when tokens exist but no user is cached yet,
 * or `null` when there is no session.
 */
export type SessionSnapshot = User | 'pending' | null

const sessionKeys = [tokenStorageKey, refreshTokenStorageKey, userStorageKey]
const listeners = new Set<() => void>()

let snapshot: SessionSnapshot = null
let snapshotSource: string | null | undefined

// Re-parses only when storage changed, so useSyncExternalStore sees a stable reference
const readSnapshot = (): SessionSnapshot => {
  const source = getRefreshToken() ? localStorage.getItem(userStorageKey) ?? '' : null
  if (source === snapshotSource) return snapshot

  snapshotSource = source
  if (source === null) {
    snapshot = null
  } else {
    try {
      snapshot = source ? (JSON.parse(source) as User) : 'pending'
    } catch {
      snapshot = 'pending'
    }
  }
  return snapshot
}

const notify = () => listeners.forEach((listener) => listener())

export const getSessionSnapshot = (): SessionSnapshot => readSnapshot()

export const subscribeSession = (listener: () => void): (() => void) => {
  // Keeps tabs in sync: logging out in one tab logs out the others
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || sessionKeys.includes(event.key)) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(tokenStorageKey, accessToken)
  localStorage.setItem(refreshTokenStorageKey, refreshToken)
  notify()
}

export const setSession = (accessToken: string, refreshToken: string, user: User): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(userStorageKey, JSON.stringify(user))
  setTokens(accessToken, refreshToken)
}

export const setCachedUser = (user: User): void => {
  // A profile response that lands after logout must not revive the session
  if (!getRefreshToken()) return
  localStorage.setItem(userStorageKey, JSON.stringify(user))
  notify()
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  sessionKeys.forEach((key) => localStorage.removeItem(key))
  notify()
}

// Called by the API client when the session can no longer be refreshed (revoked or expired)
export const endSession = clearTokens

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
