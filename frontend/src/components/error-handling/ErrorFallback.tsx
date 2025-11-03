import React from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  title?: string
  message?: string
  showRetry?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  showRetry = true,
  size = 'md'
}) => {
  const alertSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
  const textSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'
  const buttonSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'

  return (
    <Alert
      icon={<IconAlertTriangle size={alertSize} />}
      title={title}
      color="red"
      variant="light"
    >
      <Stack gap="sm">
        <Text size={textSize}>
          {message}
        </Text>
        
        {process.env.NODE_ENV === 'development' && error && (
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {error.message}
          </Text>
        )}

        {showRetry && resetError && (
          <Button
            size={buttonSize}
            leftSection={<IconRefresh size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />}
            onClick={resetError}
            variant="light"
          >
            Try Again
          </Button>
        )}
      </Stack>
    </Alert>
  )
}

export default ErrorFallback