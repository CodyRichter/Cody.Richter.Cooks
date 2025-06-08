import {
  ActionIcon,
  Burger,
  Button,
  Divider,
  Group,
  Menu,
  Text,
  em,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconLogin,
  IconLogout,
  IconPencilPlus,
  IconUserCircle,
} from "@tabler/icons-react";
import React, { useEffect } from "react";

import Typist from "react-typist-component";
import { useAuth } from "react-oidc-context";
import { useMediaQuery } from "@mantine/hooks";
import { useRouter } from "next/router";

interface NavigationHeaderProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile(): void;
  toggleDesktop(): void;
}

export default function NavigationHeader({
  mobileOpened,
  desktopOpened,
  toggleMobile,
  toggleDesktop,
}: NavigationHeaderProps) {
  const router = useRouter();
  const auth = useAuth();
  const isMobile = useMediaQuery(`(max-width: ${em(767)})`);
  const [isMobileActionsMenuOpen, setIsMobileActionsMenuOpen] =
    React.useState(false);

  // Close the mobile actions menu when/if the screen size changes to improve UX
  useEffect(() => {
    if (!isMobile) {
      setIsMobileActionsMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <>
      <Group mt="md" ml="md" mr="md" justify="space-between">
        <Group gap="0">
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
            className="headerSidebarNavContainer"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
            className="headerSidebarNavContainer"
          />

          <Divider orientation="vertical" size="xs" ml="sm" mr="sm" />

          <Text
            span
            size="xl"
            fw={500}
            style={{ cursor: "pointer" }}
            className="zeroRight"
            onClick={() => router.push("/")}
          >
            Cody Richter C
          </Text>

          <Typist
            typingDelay={130}
            loop={false}
            hideCursorWhenDone
            cursor={
              <Text span size="xl" fw={500}>
                |
              </Text>
            }
          >
            <Text
              span
              size="xl"
              fw={500}
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              odes
            </Text>
            <Text>&#8203;</Text>
            <Typist.Delay ms={2000} />
            <Typist.Backspace count={5} />
            <Text
              span
              size="xl"
              fw={500}
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              ooks
            </Text>
          </Typist>
        </Group>

        {/* The Right Menu Is Split Between the Mobile and Desktop Views */}
        {/* The Mobile view will show all options in a dropdown menu,  */}
        {/* while the Desktop view will show them inline as buttons. */}

        {isMobile ? (
          <>
            <Menu shadow="lg" width={280}>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  hiddenFrom="sm"
                  radius={"xl"}
                  onClick={() => setIsMobileActionsMenuOpen((prev) => !prev)}
                >
                  <IconDotsVertical />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {auth.isAuthenticated ? (
                  <>
                    <Menu.Label>Application</Menu.Label>
                    <Menu.Item
                      leftSection={<IconPencilPlus size={14} />}
                      onClick={() => router.push("/recipes/create")}
                    >
                      Create Recipe
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Account</Menu.Label>

                    <Menu.Item
                      leftSection={<IconUserCircle size={14} />}
                      onClick={() => router.push("/auth/account")}
                    >
                      Account Settings
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconLogout size={14} />}
                      onClick={() => auth.removeUser()}
                    >
                      Logout
                    </Menu.Item>
                  </>
                ) : (
                  <>
                    <Menu.Label>Account</Menu.Label>
                    <Menu.Item
                      onClick={() => auth.signinRedirect()}
                      leftSection={<IconLogin size={14} />}
                    >
                      Login / Register
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </>
        ) : (
          <Group>
            {auth.isAuthenticated && (
              <>
                <Button
                  rightSection={<IconPencilPlus />}
                  variant="subtle"
                  size="sm"
                  visibleFrom="sm"
                  gradient={{
                    from: "rgba(80, 70, 232, 1)",
                    to: "rgba(45, 237, 237, 1)",
                    deg: 211,
                  }}
                  onClick={() => router.push("/recipes/create")}
                >
                  Create Recipe
                </Button>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  hiddenFrom="sm"
                  onClick={() => router.push("/recipes/create")}
                >
                  <IconPencilPlus />
                </ActionIcon>

                <Divider orientation="vertical" size="xs" />

                <ActionIcon
                  variant="subtle"
                  size={isMobile ? "md" : "lg"}
                  onClick={() => router.push("/auth/account")}
                >
                  <IconUserCircle />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={() => auth.removeUser()}
                >
                  <IconLogout />
                </ActionIcon>
              </>
            )}
            {!auth.isAuthenticated && (
              <>
                <Button
                  rightSection={<IconLogin />}
                  variant="subtle"
                  size="sm"
                  visibleFrom="sm"
                  gradient={{
                    from: "rgba(80, 70, 232, 1)",
                    to: "rgba(45, 237, 237, 1)",
                    deg: 211,
                  }}
                  onClick={() => auth.signinRedirect()}
                >
                  Login / Register
                </Button>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  hiddenFrom="sm"
                  onClick={() => auth.signinRedirect()}
                >
                  <IconLogin />
                </ActionIcon>
              </>
            )}
          </Group>
        )}
      </Group>
    </>
  );
}
