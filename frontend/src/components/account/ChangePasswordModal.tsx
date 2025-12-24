import {
  Alert,
  Button,
  Group,
  List,
  Modal,
  PasswordInput,
  Text,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { useChangePassword } from "@/hooks/useAuthMutations";
import { getErrorMessage } from "@/utils/errorUtils";

interface ChangePasswordModalProps {
  opened: boolean;
  close: () => void;
}

export default function ChangePasswordModal({ opened, close }: ChangePasswordModalProps) {
  const isMobile = useMediaQuery("(max-width: 50em)");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const changePasswordMutation = useChangePassword();

  function resetAndClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setValidationError("");
    changePasswordMutation.reset();
    close();
  }

  async function handleChangePassword() {
    setValidationError("");

    if (newPassword !== confirmPassword) {
      setValidationError("New password and confirmation do not match.");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          notifications.show({
            title: "Password Changed",
            message: "Your password has been successfully changed.",
            color: "green",
          });
          resetAndClose();
        }
      }
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title="Change Password"
      centered
      size="lg"
      fullScreen={isMobile}
    >
      <Text size="sm">
        Please enter your new password below. The password that you enter must
        be match the following criteria:
      </Text>

      <List size="sm" withPadding mb="md">
        <List.Item>Minimum of 8 characters</List.Item>
        <List.Item>At least one uppercase letter</List.Item>
        <List.Item>At least one lowercase letter</List.Item>
        <List.Item>At least one number</List.Item>
        <List.Item>At least one special character (e.g., !@#$%^&*)</List.Item>
      </List>

      <PasswordInput
        data-autofocus
        label="Current Password"
        name="current-password"
        autoComplete="current-password"
        placeholder="************"
        mb="md"
        onChange={(e) => setCurrentPassword(e.currentTarget.value)}
        value={currentPassword}
        required
      />
      <PasswordInput
        label="New Password"
        name="new-password"
        autoComplete="new-password"
        placeholder="************"
        onChange={(e) => setNewPassword(e.currentTarget.value)}
        required
      />
      <PasswordInput
        label="Confirm New Password"
        name="confirm-password"
        autoComplete="new-password"
        mt="md"
        placeholder="************"
        onChange={(e) => setConfirmPassword(e.currentTarget.value)}
        required
      />

      {(validationError || changePasswordMutation.error) && (
        <Alert
          variant="light"
          color="red"
          icon={<IconAlertTriangle size={20} />}
          mt="md"
        >
          <Text c="red" size="sm">
            {validationError || getErrorMessage(changePasswordMutation.error)}
          </Text>
        </Alert>
      )}

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={resetAndClose}>
          Cancel
        </Button>
        <Button
          onClick={handleChangePassword}
          disabled={
            currentPassword === "" ||
            newPassword === "" ||
            confirmPassword === ""
          }
          loading={changePasswordMutation.isPending}
        >
          Change Password
        </Button>
      </Group>
    </Modal>
  );
}
