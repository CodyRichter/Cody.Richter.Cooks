import {
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import { PiChefHatThin } from "react-icons/pi";
import React from "react";

interface LoginDialogProps {
  opened: boolean;
  close: () => void;
}

export default function LoginDialog({ opened, close }: LoginDialogProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <Modal opened={opened} onClose={close} title="Welcome Back!">
      <Stack align="stretch" justify="center" gap="md">
        <PiChefHatThin
          size={150}
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: -25,
          }}
        />
        <Text ta="center" size="xl">
          Cody Richter Cooks
        </Text>

        <Divider variant="dashed" />

        <TextInput
          label="Email"
          placeholder="Email Address"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <TextInput
          label="Password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
      </Stack>
      <Group justify="flex-end" gap="md" mt="md">
        <Button onClick={close} color="gray">
          Cancel
        </Button>
        <Button color="blue" disabled={!email || !password}>
          Login
        </Button>
      </Group>
    </Modal>
  );
}
