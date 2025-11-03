import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAccessToken, isTokenExpiringSoon } from '../utils/auth'

export const useTokenRefresh = () => {
  const { refreshToken, isAuthenticated } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkToken = async () => {
      if (isRefreshingRef.current) return

      const accessToken = getAccessToken()
      if (!accessToken) return

      if (isTokenExpiringSoon(accessToken, 5)) {
        isRefreshingRef.current = true
        try {
          await refreshToken()
        } catch (error) {
          console.error('Token refresh failed:', error)
        } finally {
          isRefreshingRef.current = false
        }
      }
    }

    checkToken()
    intervalRef.current = setInterval(checkToken, 60000) // Check every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAuthenticated, refreshToken])
}