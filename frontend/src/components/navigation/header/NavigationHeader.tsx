import {
  ActionIcon,
  Burger,
  Button,
  Divider,
  Group,
  Menu,
  Text,
} from "@mantine/core";
import {
  IconLogout,
  IconPencilPlus,
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


  return (
    <>
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
        </Group>

        {isMobile ? (
          <>
            {auth.isAuthenticated ? (
              <Group gap="0">
                <ActionIcon
                  variant="subtle"
                  size="xl"
                  hiddenFrom="sm"
                  radius="xl"
                  color="gray"
                  onClick={() => router.push('/recipes/create')}
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
                      onClick={() => router.push('/auth/account')}
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
                onClick={() => router.push('/auth/login')}
                color="gray"
              >
                Log in
              </Button>
            )}
          </>
        ) : (
          <Group gap="sm">
            {auth.isAuthenticated ? (
              <>
                <Button
                  leftSection={<IconPencilPlus size={20} />}
                  variant="default"
                  radius="xl"
                  h={38}
                  onClick={() => router.push('/recipes/create')}
                >
                  Create Recipe
                </Button>

                <Menu shadow="md" width={200} position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size={38} radius="xl" color="black">
                      <IconUserCircle size={24} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Account</Menu.Label>
                    <Menu.Item
                      leftSection={<IconUserCircle size={16} />}
                      onClick={() => router.push('/auth/account')}
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
                onClick={() => router.push('/auth/login')}
              >
                Log in
              </Button>
            )}
          </Group>
        )}
      </Group>
    </>
  );
}
