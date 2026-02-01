'use client';

import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import NavigationHeader from "@/components/navigation/header/NavigationHeader";
import NavigationSidebar from "@/components/navigation/sidebar/NavigationSidebar";
import ClientOnly from "@/components/ClientOnly";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <ClientOnly>
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
          {children}
        </AppShell.Main>
      </AppShell>
    </ClientOnly>
  );
}
