import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react'
import { User, UserRegistration } from '@/types/User'
import { authApi } from '@/services/apiServices'
import { refreshSession } from '@/utils/apiClient'
import { SESSION_EXPIRED_EVENT, clearTokens, getRefreshToken, setTokens } from '@/utils/auth'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { formatNotificationError } from '@/utils/notificationUtils'

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
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
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
  logoutAllSessions: () => Promise<void>
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

  // Restore authentication state on app load. An expired access token is
  // refreshed transparently by the API client.
  useEffect(() => {
    if (!getRefreshToken()) return

    // Rejected sessions are ended by the API client (SESSION_EXPIRED_EVENT);
    // other failures (e.g. backend cold start) keep the tokens for a retry.
    authApi.getProfile()
      .then((user) => dispatch({ type: 'AUTH_RESTORE', payload: { user } }))
      .catch(() => dispatch({ type: 'AUTH_FINISH_LOADING' }))
  }, [])

  // The API client ends the session when a refresh is rejected (expired or revoked)
  useEffect(() => {
    const handleSessionExpired = () => dispatch({ type: 'AUTH_LOGOUT' })
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  // Login function with JWT authentication
  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const tokenResponse = await authApi.login({ username, password })
      setTokens(tokenResponse.access_token, tokenResponse.refresh_token)
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: tokenResponse.user } })
      notifications.show({
        title: 'Welcome back!',
        message: `It's great to see you again, ${tokenResponse.user.username}.`,
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    } catch (error: unknown) {
      const errorMessage = formatNotificationError(error)
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
      await authApi.register(userData)
      // We don't dispatch AUTH_SUCCESS anymore because we want the user to login manually after registration
      dispatch({ type: 'AUTH_FINISH_LOADING' })
      notifications.show({
        title: 'Welcome to the Kitchen!',
        message: 'Your account has been created. Grab your apron and log in!',
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    } catch (error: unknown) {
      const errorMessage = formatNotificationError(error)
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

  // Logout clears this browser's tokens; they expire on their own server-side
  const logout = useCallback(async () => {
    clearTokens()
    dispatch({ type: 'AUTH_LOGOUT' })
    notifications.show({
      title: 'See you next time!',
      message: 'You have been successfully logged out.',
      color: 'blue',
      icon: <IconCheck size={18} />,
    })
  }, [])

  // Revoke every token issued to this account, on all devices
  const logoutAllSessions = useCallback(async () => {
    await authApi.logoutAll()
    clearTokens()
    dispatch({ type: 'AUTH_LOGOUT' })
    notifications.show({
      title: 'Signed out everywhere',
      message: 'All sessions on every device have been signed out.',
      color: 'blue',
      icon: <IconCheck size={18} />,
    })
  }, [])

  // Proactive refresh; failures end the session via SESSION_EXPIRED_EVENT
  const refreshToken = useCallback(async () => {
    if (typeof window === 'undefined') return
    await refreshSession()
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
    logoutAllSessions,
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
