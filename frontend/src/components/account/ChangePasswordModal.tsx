import {
  Button,
  Group,
  Modal,
  PasswordInput,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { useChangePassword } from "@/hooks/useAuthMutations";
import { formatNotificationError } from "@/utils/notificationUtils";
import { PasswordStrength, getPasswordStrength } from "@/components/auth/PasswordStrength";

interface ChangePasswordModalProps {
  opened: boolean;
  close: () => void;
}

export default function ChangePasswordModal({ opened, close }: ChangePasswordModalProps) {
  const isMobile = useMediaQuery("(max-width: 50em)");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useChangePassword();

  function resetAndClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    changePasswordMutation.reset();
    close();
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
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
        },
        onError: (error) => {
          notifications.show({
            title: "Error Changing Password",
            message: formatNotificationError(error),
            color: "red",
            icon: <IconAlertTriangle size={20} />,
          });
        }
      }
    );
  }

  function handleValidationAndSubmit() {
    if (newPassword !== confirmPassword) {
      notifications.show({
        title: "Validation Error",
        message: "New password and confirmation do not match.",
        color: "red",
        icon: <IconAlertTriangle size={20} />,
      });
      return;
    }

    if (getPasswordStrength(newPassword) < 5) {
      notifications.show({
        title: "Validation Error",
        message: "Password does not meet complexity requirements.",
        color: "red",
        icon: <IconAlertTriangle size={20} />,
      });
      return;
    }

    handleChangePassword();
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
      <PasswordStrength
        label="New Password"
        name="new-password"
        autoComplete="new-password"
        placeholder="************"
        value={newPassword}
        onChange={setNewPassword}
        mb="md"
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



      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={resetAndClose}>
          Cancel
        </Button>
        <Button
          onClick={handleValidationAndSubmit}
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
