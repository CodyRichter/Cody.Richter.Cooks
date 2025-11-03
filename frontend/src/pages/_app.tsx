import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@/styles/styles.css";

import { AppShell, MantineProvider, createTheme } from "@mantine/core";
import Head from "next/head";
import { Notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import NavigationHeader from "../components/navigation/header/NavigationHeader";
import NavigationSidebar from "../components/navigation/sidebar/NavigationSidebar";
import GlobalErrorBoundary from "../components/error-handling/GlobalErrorBoundary";
import TokenRefreshManager from "../components/TokenRefreshManager";
import type { AppProps } from "next/app";

const theme = createTheme({
  fontFamily: "Nunito, sans-serif",
});

// Create a client
const queryClient = new QueryClient({
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
})

export default function App({ Component, pageProps }: AppProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [mounted, setMounted] = useState(false);

  // Ensure notifications only render on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <GlobalErrorBoundary>
          <AuthProvider>
            <TokenRefreshManager>
              <Head>
                <title>Cody Richter Cooks</title>
                <meta
                  name="viewport"
                  content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
                />
                <link rel="shortcut icon" href="/chef-hat.svg" />
              </Head>
              {mounted && <Notifications autoClose={4000} position="top-center" />}
              <AppShell
                header={{ height: { base: 60, md: 65, lg: 65 } }}
                navbar={{
                  width: { base: 200, md: 300, lg: 300 },
                  breakpoint: "sm",
                  collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
                }}
                padding="md"
              >
                <AppShell.Header className="navigationHeader">
                  <NavigationHeader
                    {...{ mobileOpened, desktopOpened, toggleMobile, toggleDesktop }}
                  />
                </AppShell.Header>
                <AppShell.Navbar className="navigationSidebarContainer">
                  <NavigationSidebar {...{ mobileOpened, desktopOpened, toggleMobile, toggleDesktop }} />
                </AppShell.Navbar>
                <AppShell.Main>
                  <Component {...pageProps} />
                </AppShell.Main>
              </AppShell>
            </TokenRefreshManager>
          </AuthProvider>
        </GlobalErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  );
}