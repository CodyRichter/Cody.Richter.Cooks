import { Burger, Button, Divider, Grid, Group, Text } from "@mantine/core";
import { IconLogin, IconLogout, IconPencilPlus } from "@tabler/icons-react";

import LoginDialog from "./Auth/LoginDialog";
import React from "react";
import Typist from "react-typist-component";
import { useAuth } from "@/common/contexts/AuthContext/AuthContext";
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

  const [loginDialogOpened, setLoginDialogOpened] = React.useState(false);
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <Grid mt="md" ml="md" mr="md">
        <Grid.Col span={8}>
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
              <Text span size="xl" fw={500} style={{ cursor: "pointer" }}>
                odes
              </Text>
              <Text>&#8203;</Text>
              <Typist.Delay ms={5000} />
              <Typist.Backspace count={5} />
              <Text span size="xl" fw={500} style={{ cursor: "pointer" }}>
                ooks
              </Text>
            </Typist>
          </Group>

          {/* <PiChefHatDuotone color="blue" height="100%" /> */}
        </Grid.Col>
        <Grid.Col span={4}>
          <Group justify="flex-end">
            {isAuthenticated && (
              <Button
                rightSection={<IconPencilPlus />}
                variant="subtle"
                size="sm"
                gradient={{
                  from: "rgba(80, 70, 232, 1)",
                  to: "rgba(45, 237, 237, 1)",
                  deg: 211,
                }}
                onClick={() => router.push("/recipes/create")}
              >
                Create Recipe
              </Button>
            )}
            {isAuthenticated && (
              <Button
                rightSection={<IconLogout />}
                variant="subtle"
                size="sm"
                gradient={{
                  from: "rgba(80, 70, 232, 1)",
                  to: "rgba(45, 237, 237, 1)",
                  deg: 211,
                }}
                onClick={logout}
              >
                Logout
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                rightSection={<IconLogin />}
                variant="subtle"
                size="sm"
                gradient={{
                  from: "rgba(80, 70, 232, 1)",
                  to: "rgba(45, 237, 237, 1)",
                  deg: 211,
                }}
                onClick={() => setLoginDialogOpened(true)}
              >
                Login
              </Button>
            )}
          </Group>
        </Grid.Col>
      </Grid>
      <LoginDialog
        opened={loginDialogOpened}
        close={() => setLoginDialogOpened(false)}
      />
    </>
  );
}
