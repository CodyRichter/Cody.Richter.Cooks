import {
  ActionIcon,
  Burger,
  Button,
  Divider,
  Group,
  Text,
} from "@mantine/core";
import { IconLogin, IconLogout, IconPencilPlus } from "@tabler/icons-react";

import React from "react";
import Typist from "react-typist-component";
import { useAuth } from "react-oidc-context";
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
            </>
          )}
          {auth.isAuthenticated && (
            <>
              <Button
                rightSection={<IconLogout />}
                variant="subtle"
                size="sm"
                visibleFrom="sm"
                gradient={{
                  from: "rgba(80, 70, 232, 1)",
                  to: "rgba(45, 237, 237, 1)",
                  deg: 211,
                }}
                onClick={() => auth.removeUser()}
              >
                Logout
              </Button>
              <ActionIcon
                variant="subtle"
                size="lg"
                hiddenFrom="sm"
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
                Login
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
      </Group>
    </>
  );
}
