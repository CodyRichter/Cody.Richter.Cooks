import { Burger, Button, Grid, Group, Text } from "@mantine/core";
import { IconLogin, IconLogout, IconPencilPlus } from "@tabler/icons-react";

import LoginDialog from "./Auth/LoginDialog";
import React from "react";
import { useAuth } from "src/common/contexts/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const [loginDialogOpened, setLoginDialogOpened] = React.useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <Grid mt="md" ml="md" mr="md">
        <Grid.Col span={4}>
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
        </Grid.Col>
        <Grid.Col span={4}>
          <Text
            ta="center"
            size="xl"
            fw={700}
            variant="gradient"
            gradient={{ from: "blue", to: "cyan", deg: 90 }}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Cody Richter Cooks
          </Text>
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
                onClick={() => navigate("/new-recipe")}
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
