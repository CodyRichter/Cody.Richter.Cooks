import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Container, Title, Text, Button, Stack, Alert } from '@mantine/core'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error, errorInfo)
    }
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container size="sm" py="xl">
          <Stack align="center" gap="lg">
            <Alert
              icon={<IconAlertTriangle size={24} />}
              title="Something went wrong"
              color="red"
              variant="light"
            >
              <Text size="sm">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </Text>
            </Alert>

            <Stack align="center" gap="md">
              <Title order={2} ta="center">
                Oops! Something went wrong
              </Title>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Text size="xs" c="dimmed" ta="center" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}

              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRetry}
                variant="filled"
              >
                Try Again
              </Button>

              <Button
                variant="subtle"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Stack>
          </Stack>
        </Container>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary