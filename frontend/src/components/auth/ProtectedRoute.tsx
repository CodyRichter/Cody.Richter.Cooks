'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Center, Loader } from '@mantine/core'

const defaultFallback = (
  <Center py="xl">
    <Loader size="lg" />
  </Center>
)

interface ProtectedRouteProps {
  children: ReactNode
  // Shown while the session is being restored; match the page's shape to avoid layout shift
  fallback?: ReactNode
}

// Renders children only for logged-in users; others go to login and come back afterwards
export default function ProtectedRoute({ children, fallback = defaultFallback }: ProtectedRouteProps) {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, router, pathname])

  return status === 'authenticated' ? <>{children}</> : <>{fallback}</>
}

// Where to go after logging in: the `next` param when it is a local path, else home
function getLoginRedirectTarget(): string {
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

// Renders children only for logged-out users (login, register); others are sent on
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(getLoginRedirectTarget())
    }
  }, [status, router])

  // Laid out but invisible until the session is known, so the form neither jumps in nor flashes
  return (
    <div style={{ visibility: status === 'unauthenticated' ? 'visible' : 'hidden' }}>
      {children}
    </div>
  )
}
