import { ActionIcon, Burger, Group, Text } from "@mantine/core";

import { IconUser } from "@tabler/icons-react";
import LoginDialog from "./Auth/LoginDialog";
import React from "react";
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

  return (
    <>
      <Group h="100%" px="md" justify="space-between" align="center">
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

        <ActionIcon
          variant="subtle"
          size="lg"
          gradient={{
            from: "rgba(80, 70, 232, 1)",
            to: "rgba(45, 237, 237, 1)",
            deg: 211,
          }}
          onClick={() => setLoginDialogOpened(true)}
        >
          <IconUser />
        </ActionIcon>
      </Group>

      <LoginDialog
        opened={loginDialogOpened}
        close={() => setLoginDialogOpened(false)}
      />
    </>
  );
}
