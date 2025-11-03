import {
  Alert,
  Button,
  Group,
  List,
  Modal,
  PasswordInput,
  Text,
} from "@mantine/core";
import {
  INITIAL_NETWORK_RESULT_WITHOUT_LOADING,
  NetworkResult,
} from "@/types/constants";

import { IconAlertTriangle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";

export default function ChangePasswordModal({ opened, close }: any) {
  const isMobile = useMediaQuery("(max-width: 50em)");
  const auth = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [networkResult, setNetworkResult] = useState<NetworkResult>(
    INITIAL_NETWORK_RESULT_WITHOUT_LOADING
  );

  function resetAndClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNetworkResult(INITIAL_NETWORK_RESULT_WITHOUT_LOADING);
    close();
  }

  async function handleChangePassword() {
    setNetworkResult({ ...networkResult, isLoading: true, error: "" });
    if (newPassword !== confirmPassword) {
      setNetworkResult({
        ...networkResult,
        isLoading: false,
        error: "New password and confirmation do not match.",
      });
      return;
    }

    try {
      // Use the new JWT-based API service
      const { authApi } = await import("@/services/apiServices");
      await authApi.changePassword(currentPassword, newPassword);

      notifications.show({
        title: "Password Changed",
        message: "Your password has been successfully changed.",
        color: "green",
      });
      resetAndClose();
    } catch (error: any) {
      let message = error?.message || error?.details?.detail || "Failed to change password.";

      // Handle validation errors
      if (error?.details?.errors) {
        const validationErrors = Object.values(error.details.errors).flat();
        message = validationErrors.join(", ");
      }

      setNetworkResult({
        ...networkResult,
        isLoading: false,
        error: message,
      });
    }
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

      {networkResult.error && (
        <Alert
          variant="light"
          color="red"
          icon={<IconAlertTriangle size={20} />}
          mt="md"
        >
          <Text c="red" size="sm">
            {networkResult.error}
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
          loading={networkResult.isLoading}
        >
          Change Password
        </Button>
      </Group>
    </Modal>
  );
}
