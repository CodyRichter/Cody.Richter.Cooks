import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useRef } from 'react'
import { User, UserRegistration, TokenResponse } from '@/types/User'
import { authApi } from '@/services/apiServices'
import { tokenStorageKey, refreshTokenStorageKey } from '@/config/environment'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'

// Authentication state interface
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Authentication action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: TokenResponse } }
  | { type: 'AUTH_ERROR'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_FINISH_LOADING' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_RESTORE'; payload: { user: User } }

// Authentication context value interface
interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  register: (userData: UserRegistration) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  refreshToken: () => Promise<void>
}

// Initial authentication state
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

// Authentication reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }

    case 'AUTH_SUCCESS':
      // Store tokens securely
      if (typeof window !== 'undefined') {
        localStorage.setItem(tokenStorageKey, action.payload.tokens.access_token)
        localStorage.setItem(refreshTokenStorageKey, action.payload.tokens.refresh_token)
      }
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case 'AUTH_RESTORE':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      }

    case 'AUTH_LOGOUT':
      // Clear tokens from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(tokenStorageKey)
        localStorage.removeItem(refreshTokenStorageKey)
      }
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }

    case 'AUTH_FINISH_LOADING':
      return {
        ...state,
        isLoading: false,
        error: null
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)

  // Restore authentication state on app load
  useEffect(() => {
    const restoreAuthState = async () => {
      if (typeof window === 'undefined') return

      const accessToken = localStorage.getItem(tokenStorageKey)
      const storedRefreshToken = localStorage.getItem(refreshTokenStorageKey)

      if (!accessToken || !storedRefreshToken) return

      try {
        // Try to get user profile to validate token
        const user = await authApi.getProfile()
        dispatch({ type: 'AUTH_RESTORE', payload: { user } })
      } catch {
        // If token is invalid, try to refresh
        try {
          const tokenResponse = await authApi.refreshToken(storedRefreshToken)
          const user = await authApi.getProfile()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              tokens: {
                ...tokenResponse,
                refresh_token: storedRefreshToken,
                user
              } as TokenResponse
            }
          })
        } catch {
          // If refresh fails, clear tokens and stay logged out
          localStorage.removeItem(tokenStorageKey)
          localStorage.removeItem(refreshTokenStorageKey)
        }
      }
    }

    restoreAuthState()
  }, [])

  // Login function with JWT authentication
  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const tokenResponse = await authApi.login({ username, password })
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: tokenResponse.user,
          tokens: tokenResponse
        }
      })
      notifications.show({
        title: 'Welcome back!',
        message: `It's great to see you again, ${tokenResponse.user.username}.`,
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    } catch (error: unknown) {
      const err = error as { message?: string; details?: { detail?: string } };
      const errorMessage = err?.message || err?.details?.detail || 'Login failed'
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } })
      notifications.show({
        title: 'Login issue',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={18} />,
      })
      throw error
    }
  }, [])

  // Register function with JWT authentication
  const register = useCallback(async (userData: UserRegistration) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const tokenResponse = await authApi.register(userData)
      // We don't dispatch AUTH_SUCCESS anymore because we want the user to login manually after registration
      dispatch({ type: 'AUTH_FINISH_LOADING' })
      notifications.show({
        title: 'Welcome to the Kitchen!',
        message: 'Your account has been created. Grab your apron and log in!',
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    } catch (error: unknown) {
      const err = error as { message?: string; details?: { detail?: string } };
      const errorMessage = err?.message || err?.details?.detail || 'Registration failed'
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } })
      notifications.show({
        title: 'Account setup issue',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={18} />,
      })
      throw error
    }
  }, [])

  // Logout function with token cleanup
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate tokens on server
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if server call fails
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Server logout failed: ${errorMessage}`, error)
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' })
      notifications.show({
        title: 'See you next time!',
        message: 'You have been successfully logged out.',
        color: 'blue',
        icon: <IconCheck size={18} />,
      })
    }
  }, [])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    refreshPromiseRef.current = (async () => {
      const refreshTokenValue = localStorage.getItem(refreshTokenStorageKey)
      if (!refreshTokenValue) {
        dispatch({ type: 'AUTH_LOGOUT' })
        return
      }

      try {
        const tokenResponse = await authApi.refreshToken(refreshTokenValue)
        const user = await authApi.getProfile()
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            tokens: {
              ...tokenResponse,
              refresh_token: refreshTokenValue,
              user
            } as TokenResponse
          }
        })
      } catch (error) {
        dispatch({ type: 'AUTH_LOGOUT' })
        throw error
      }
    })()

    try {
      await refreshPromiseRef.current
    } finally {
      refreshPromiseRef.current = null
    }
  }, [])

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
