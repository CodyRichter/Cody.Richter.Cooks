import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { refreshSession } from '@/utils/apiClient'
import { getAccessToken, isTokenExpiringSoon } from '@/utils/auth'

// Proactive refresh; a rejected refresh ends the session inside the API client
export const useTokenRefresh = () => {
  const { status } = useAuth()

  useEffect(() => {
    if (status !== 'authenticated') return

    const checkToken = () => {
      const accessToken = getAccessToken()
      if (!accessToken || !isTokenExpiringSoon(accessToken, 5)) return

      refreshSession().catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Token refresh failed: ${errorMessage}`, error)
      })
    }

    checkToken()
    const interval = setInterval(checkToken, 60000)
    return () => clearInterval(interval)
  }, [status])
}
