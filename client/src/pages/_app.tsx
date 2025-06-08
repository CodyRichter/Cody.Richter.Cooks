import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/core/styles.css";
import "@/styles/styles.css";

import { AppShell, MantineProvider, createTheme } from "@mantine/core";

import { AuthProvider } from "react-oidc-context";
import Head from "next/head";
import NavigationHeader from "@/common/components/Navigation/Header/NavigationHeader";
import NavigationSidebar from "@/common/components/Navigation/Sidebar/NavigationSidebar";
import { Notifications } from "@mantine/notifications";
import getCodyRichterCooksTheme from "@/styles/theme";
import { isDevEnvironment } from "@/utils/development";
import { useDisclosure } from "@mantine/hooks";

const primaryFont = "Nunito, sans-serif";
const theme = createTheme(getCodyRichterCooksTheme(primaryFont));

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_iWzlwY8et",
  client_id: "4mpm5q3jhvre834inbke4jcl31",
  // Dynamically update the redirect_uri based on the environment
  redirect_uri: isDevEnvironment
    ? "http://localhost:3000"
    : "https://cooking.cody.richter.codes",
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid phone profile",
};

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
          <AppShell.Navbar>
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
