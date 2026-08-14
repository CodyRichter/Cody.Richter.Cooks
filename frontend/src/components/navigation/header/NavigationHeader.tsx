import {
  ActionIcon,
  Burger,
  Button,
  Divider,
  Group,
  Menu,
  Switch,
  Text,
  Badge,
  Tooltip,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import {
  IconLogout,
  IconMoonStars,
  IconPencilPlus,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react";
import React from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@mantine/hooks";
import { useRouter } from "next/navigation";

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
  const isMobile = useMediaQuery("(max-width: 50em)");

  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = computedColorScheme === "dark";

  const themeSwitch = (
    <Tooltip
      label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      withArrow
      position="bottom"
      openDelay={150}
    >
      <Switch
        size="md"
        color="dark.4"
        checked={isDark}
        onChange={() => toggleColorScheme()}
        onLabel={
          <IconSun
            size={16}
            stroke={2.5}
            color="var(--mantine-color-yellow-4)"
          />
        }
        offLabel={
          <IconMoonStars
            size={16}
            stroke={2.5}
            color="var(--mantine-color-blue-6)"
          />
        }
        aria-label="Toggle dark mode"
      />
    </Tooltip>
  );

  return (
    <Group h="100%" px="md" justify="space-between" align="center">
      <Group gap="xs">
        <Burger
          opened={mobileOpened}
          onClick={toggleMobile}
          hiddenFrom="sm"
          size="sm"
        />
        <Burger
          opened={desktopOpened}
          onClick={toggleDesktop}
          visibleFrom="sm"
          size="sm"
        />

        <Divider orientation="vertical" size="xs" mx="sm" />

        <Text
          component="span"
          fw={500}
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: isMobile ? "1.0rem" : "1.4rem",
            cursor: "pointer",
            letterSpacing: "-0.7px",
            lineHeight: 1,
          }}
          onClick={() => router.push("/")}
        >
          Cody Richter Cooks
        </Text>
        {process.env.NODE_ENV !== "production" && (
          <Badge
            color="red"
            variant="filled"
            size="lg"
            radius="md"
            style={{ cursor: "default" }}
          >
            DEV
          </Badge>
        )}
      </Group>

      {isMobile ? (
        <Group gap="xs" align="center">
          {themeSwitch}
          {auth.isAuthenticated ? (
            <Group gap="0">
              <ActionIcon
                variant="subtle"
                size="xl"
                hiddenFrom="sm"
                radius="xl"
                color="gray"
                onClick={() => router.push("/recipes/create")}
              >
                <IconPencilPlus size={28} />
              </ActionIcon>
              <Menu shadow="lg" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    size="xl"
                    hiddenFrom="sm"
                    radius="xl"
                    color="gray"
                  >
                    <IconUserCircle size={28} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item
                    leftSection={<IconUserCircle size={16} />}
                    onClick={() => router.push("/auth/account")}
                  >
                    Account Settings
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    color="red"
                    onClick={() => auth.logout()}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => router.push("/auth/login")}
              color="gray"
            >
              Log in
            </Button>
          )}
        </Group>
      ) : (
        <Group gap="sm" align="center">
          {themeSwitch}
          <Divider orientation="vertical" size="xs" mx={4} />
          {auth.isAuthenticated ? (
            <>
              <Button
                leftSection={<IconPencilPlus size={20} />}
                variant="default"
                radius="xl"
                h={38}
                onClick={() => router.push("/recipes/create")}
              >
                Create Recipe
              </Button>

              <Menu shadow="md" width={200} position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    size={38}
                    radius="xl"
                    c="var(--mantine-color-text)"
                  >
                    <IconUserCircle size={24} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item
                    leftSection={<IconUserCircle size={16} />}
                    onClick={() => router.push("/auth/account")}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    color="red"
                    onClick={() => auth.logout()}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          ) : (
            <Button
              variant="default"
              radius="xl"
              h={38}
              onClick={() => router.push("/auth/login")}
            >
              Log in
            </Button>
          )}
        </Group>
      )}
    </Group>
  );
}
