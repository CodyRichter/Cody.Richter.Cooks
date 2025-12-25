'use client';

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import GlobalErrorBoundary from "../components/error-handling/GlobalErrorBoundary";
import TokenRefreshManager from "../components/TokenRefreshManager";
import { useState } from "react";

const theme = createTheme({
  fontFamily: "var(--font-inter), sans-serif",
  headings: {
    fontFamily: "var(--font-inter), sans-serif",
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: unknown) => {
          // Don't retry 404s
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) return false
          // Retry network errors up to 3 times
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
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
