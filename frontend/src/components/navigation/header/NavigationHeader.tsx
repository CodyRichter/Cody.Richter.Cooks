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
  Box,
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

  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = computedColorScheme === "dark";

  return (
    <Group h="100%" px={{ base: "xs", sm: "md" }} justify="space-between" align="center" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" align="center" style={{ minWidth: 0, flexShrink: 1 }}>
        <Burger
          opened={mobileOpened}
          onClick={toggleMobile}
          hiddenFrom="sm"
          size="sm"
          aria-label="Toggle navigation menu"
        />
        <Burger
          opened={desktopOpened}
          onClick={toggleDesktop}
          visibleFrom="sm"
          size="sm"
          aria-label="Toggle navigation sidebar"
        />

        <Divider orientation="vertical" size="xs" mx="xs" />

        <Text
          component="span"
          fw={500}
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "clamp(1.0rem, 4vw, 1.4rem)",
            cursor: "pointer",
            letterSpacing: "-0.7px",
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onClick={() => router.push("/")}
        >
          Cody Richter Cooks
        </Text>
        {process.env.NODE_ENV !== "production" && (
          <Badge
            color="red"
            variant="filled"
            size="sm"
            radius="md"
            visibleFrom="sm"
            style={{ cursor: "default" }}
          >
            DEV
          </Badge>
        )}
      </Group>

      <Group gap="xs" wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
        {/* Mobile Theme Toggle (ActionIcon) */}
        <Box hiddenFrom="sm">
          <Tooltip
            label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            position="bottom"
            openDelay={150}
          >
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="xl"
              color="gray"
              onClick={() => toggleColorScheme()}
              aria-label="Toggle color scheme"
            >
              {isDark ? (
                <IconSun size={20} stroke={2} color="var(--mantine-color-yellow-4)" />
              ) : (
                <IconMoonStars size={20} stroke={2} color="var(--mantine-color-blue-6)" />
              )}
            </ActionIcon>
          </Tooltip>
        </Box>

        {/* Desktop Theme Toggle (Switch) */}
        <Box visibleFrom="sm">
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
        </Box>

        {auth.isAuthenticated ? (
          <>
            {/* Mobile Create Recipe Button */}
            <ActionIcon
              variant="subtle"
              size="lg"
              hiddenFrom="sm"
              radius="xl"
              color="gray"
              onClick={() => router.push("/recipes/create")}
              aria-label="Create recipe"
            >
              <IconPencilPlus size={22} />
            </ActionIcon>

            <Divider orientation="vertical" size="xs" mx={4} visibleFrom="sm" />

            {/* Desktop Create Recipe Button */}
            <Button
              leftSection={<IconPencilPlus size={20} />}
              variant="default"
              radius="xl"
              h={38}
              visibleFrom="sm"
              onClick={() => router.push("/recipes/create")}
            >
              Create Recipe
            </Button>

            {/* Account Menu (Mobile & Desktop) */}
            <Menu shadow="md" width={200} position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="xl"
                  color="gray"
                  aria-label="Account menu"
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
                  Account Settings
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
          <>
            <Button
              variant="subtle"
              size="sm"
              hiddenFrom="sm"
              onClick={() => router.push("/auth/login")}
              color="gray"
            >
              Log in
            </Button>
            <Button
              variant="default"
              radius="xl"
              h={38}
              visibleFrom="sm"
              onClick={() => router.push("/auth/login")}
            >
              Log in
            </Button>
          </>
        )}
      </Group>
    </Group>
  );
}
