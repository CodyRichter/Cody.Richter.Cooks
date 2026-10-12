'use client'

import { createContext, ReactNode, useContext, useMemo, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User } from '@/types/User'
import { authApi } from '@/services/apiServices'
import { getSessionSnapshot, setCachedUser, subscribeSession } from '@/utils/auth'

/**
 * `loading` covers server rendering and hydration (localStorage is unreadable
 * there) and sessions whose user has not been fetched yet. UI that depends on
 * auth must wait it out rather than assume the user is logged out.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  isAuthenticated: boolean
}

export const authQueryKeys = {
  all: ['auth'] as const,
  me: ['auth', 'me'] as const,
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getServerSessionSnapshot = () => undefined

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot)
  const hasSession = session !== undefined && session !== null

  // Revalidates the cached user. Rejected sessions are ended by the API client;
  // other failures (e.g. backend cold start) keep the session and retry.
  const { isError: isProfileError } = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async () => {
      const user = await authApi.getProfile()
      setCachedUser(user)
      return user
    },
    enabled: hasSession,
  })

  const value = useMemo<AuthContextValue>(() => {
    if (session === undefined || (session === 'pending' && !isProfileError)) {
      return { status: 'loading', user: null, isAuthenticated: false }
    }
    if (session === null || session === 'pending') {
      return { status: 'unauthenticated', user: null, isAuthenticated: false }
    }
    return { status: 'authenticated', user: session, isAuthenticated: true }
  }, [session, isProfileError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
