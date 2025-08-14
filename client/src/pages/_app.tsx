import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/core/styles.css";
import "@/styles/styles.css";

import { AppShell, MantineProvider, createTheme } from "@mantine/core";

import { AuthProvider } from "react-oidc-context";
import Head from "next/head";
import NavigationHeader from "@/components/navigation/header/NavigationHeader";
import NavigationSidebar from "@/components/navigation/sidebar/NavigationSidebar";
import { Notifications } from "@mantine/notifications";
import { cognitoAuthConfig } from "@/utils/auth";
import getCodyRichterCooksTheme from "@/styles/theme";
import { useDisclosure } from "@mantine/hooks";

const primaryFont = "Nunito, sans-serif";
const theme = createTheme(getCodyRichterCooksTheme(primaryFont));

export default function App({ Component, pageProps }: any) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <MantineProvider theme={theme}>
      <AuthProvider {...cognitoAuthConfig}>
        <Head>
          <title>Cody Richter Cooks</title>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
          />
          <link rel="shortcut icon" href="/chef-hat.svg" />
        </Head>
        <Notifications autoClose={4000} position="top-center" />
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
            <NavigationSidebar
              {...{ mobileOpened, desktopOpened, toggleMobile, toggleDesktop }}
            />
          </AppShell.Navbar>
          <AppShell.Main>
            <Component {...pageProps} />
          </AppShell.Main>
        </AppShell>
      </AuthProvider>
    </MantineProvider>
  );
}
