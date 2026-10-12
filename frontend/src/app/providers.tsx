'use client';

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalErrorBoundary from "@/components/error-handling/GlobalErrorBoundary";
import TokenRefreshManager from "@/components/TokenRefreshManager";
import { theme } from "@/styles/theme";
import { ApiError } from "@/utils/apiClient";
import { useState } from "react";

// Client errors (bad request, auth, not found) won't succeed on retry
const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <GlobalErrorBoundary>
          <AuthProvider>
            <TokenRefreshManager>
              <Notifications autoClose={4000} position="top-center" />
              {children}
            </TokenRefreshManager>
          </AuthProvider>
        </GlobalErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  );
}
