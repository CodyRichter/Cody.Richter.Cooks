import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react'
import { User, UserRegistration, TokenResponse } from '../types/User'
import { authApi } from '../services/apiServices'
import { tokenStorageKey, refreshTokenStorageKey } from '../config/environment'

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

  // Restore authentication state on app load
  useEffect(() => {
    const restoreAuthState = async () => {
      if (typeof window === 'undefined') return

      const accessToken = localStorage.getItem(tokenStorageKey)
      const refreshToken = localStorage.getItem(refreshTokenStorageKey)

      if (!accessToken || !refreshToken) return

      try {
        // Try to get user profile to validate token
        const user = await authApi.getProfile()
        dispatch({ type: 'AUTH_RESTORE', payload: { user } })
      } catch (error) {
        // If token is invalid, try to refresh
        try {
          const tokenResponse = await authApi.refreshToken(refreshToken)
          const user = await authApi.getProfile()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              tokens: tokenResponse
            }
          })
        } catch (refreshError) {
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
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.detail || 'Login failed'
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } })
      throw error
    }
  }, [])

  // Register function with JWT authentication
  const register = useCallback(async (userData: UserRegistration) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const tokenResponse = await authApi.register(userData)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: tokenResponse.user,
          tokens: tokenResponse
        }
      })
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.detail || 'Registration failed'
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } })
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
      console.warn('Server logout failed, continuing with local logout:', error)
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }, [])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (typeof window === 'undefined') return

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
          tokens: tokenResponse
        }
      })
    } catch (error) {
      dispatch({ type: 'AUTH_LOGOUT' })
      throw error
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