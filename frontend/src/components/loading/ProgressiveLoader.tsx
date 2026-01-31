import React, { useState, useEffect } from 'react'
import { Stack, Progress, Text, Center } from '@mantine/core'

interface ProgressiveLoaderProps {
  isLoading: boolean
  progress?: number
  message?: string
  children?: React.ReactNode
  showProgress?: boolean
  estimatedDuration?: number
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  isLoading,
  progress,
  message = 'Loading...',
  children,
  showProgress = false,
  estimatedDuration = 3000
}) => {
  const [simulatedProgress, setSimulatedProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSimulatedProgress(0)
      return
    }

    if (progress !== undefined) {
      setSimulatedProgress(progress)
      return
    }

    // Simulate progress if no real progress is provided
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, estimatedDuration / 10)

    return () => clearInterval(interval)
  }, [isLoading, progress, estimatedDuration])

  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <Center py="xl">
      <Stack align="center" gap="md" style={{ minWidth: 200 }}>
        <Text size="sm" c="dimmed">
          {message}
        </Text>

        {showProgress && (
          <Progress
            value={simulatedProgress}
            size="sm"
            radius="xl"
            style={{ width: '100%' }}
            animated
          />
        )}

        {children}
      </Stack>
    </Center>
  )
}

export default ProgressiveLoader
