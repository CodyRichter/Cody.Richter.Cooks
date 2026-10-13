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
  Skeleton,
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
import { useMounted } from "@mantine/hooks";
import React from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/useAuthMutations";
import Link from "next/link";
import { LinkPendingIcon } from "@/components/navigation/LinkPendingIcon";

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
  const { status } = useAuth();
  const logout = useLogout();

  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  // The server can't know the stored scheme, so match its light render until mounted
  const mounted = useMounted();
  const isDark = mounted && computedColorScheme === "dark";

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
          component={Link}
          href="/"
          c="inherit"
          td="none"
          fw={500}
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "clamp(1.0rem, 4vw, 1.4rem)",
            letterSpacing: "-0.7px",
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
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

        {status === "loading" ? (
          // Same footprint as the logged-out buttons while the session is restored
          <>
            <Skeleton hiddenFrom="sm" h={30} w={64} radius="sm" />
            <Skeleton visibleFrom="sm" h={38} w={84} radius="xl" />
          </>
        ) : status === "authenticated" ? (
          <>
            {/* Mobile Create Recipe Button */}
            <ActionIcon
              variant="subtle"
              size="lg"
              hiddenFrom="sm"
              radius="xl"
              color="gray"
              component={Link}
              href="/recipes/create"
              aria-label="Create recipe"
            >
              <LinkPendingIcon size={20} icon={<IconPencilPlus size={22} />} />
            </ActionIcon>

            <Divider orientation="vertical" size="xs" mx={4} visibleFrom="sm" />

            {/* Desktop Create Recipe Button */}
            <Button
              component={Link}
              href="/recipes/create"
              leftSection={<LinkPendingIcon size={18} icon={<IconPencilPlus size={20} />} />}
              variant="default"
              radius="xl"
              h={38}
              visibleFrom="sm"
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
                  component={Link}
                  href="/auth/account"
                  leftSection={<IconUserCircle size={16} />}
                >
                  Account Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  color="red"
                  onClick={logout}
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
              component={Link}
              href="/auth/login"
              color="gray"
            >
              Log in
            </Button>
            <Button
              variant="default"
              radius="xl"
              h={38}
              visibleFrom="sm"
              component={Link}
              href="/auth/login"
            >
              Log in
            </Button>
          </>
        )}
      </Group>
    </Group>
  );
}
