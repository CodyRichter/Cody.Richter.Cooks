import { Button, Group, Modal, PasswordInput, Stack } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { PasswordStrength, getPasswordStrength } from "@/components/auth/PasswordStrength";
import { useChangePassword } from "@/hooks/useAuthMutations";
import { ApiError } from "@/utils/apiClient";
import { formatNotificationError } from "@/utils/notificationUtils";

interface ChangePasswordModalProps {
  opened: boolean;
  close: () => void;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function ChangePasswordForm({ close }: { close: () => void }) {
  const changePassword = useChangePassword();
  const form = useForm<PasswordValues>({
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validate: {
      currentPassword: isNotEmpty("Enter your current password"),
      newPassword: (value) =>
        getPasswordStrength(value) < 5 ? "Password doesn't meet the requirements" : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? "Passwords don't match" : null,
    },
  });

  function handleSubmit({ currentPassword, newPassword }: PasswordValues) {
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          notifications.show({
            title: "Password changed",
            message: "Other devices were signed out and AI tokens were revoked.",
            color: "green",
            icon: <IconCheck size={18} />,
          });
          close();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 400) {
            form.setFieldError("currentPassword", "Incorrect password");
            return;
          }
          notifications.show({
            title: "Could not change password",
            message: formatNotificationError(error),
            color: "red",
            icon: <IconX size={18} />,
          });
        },
      }
    );
  }

  const newPasswordProps = form.getInputProps("newPassword");

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        <PasswordInput
          label="Current password"
          name="current-password"
          autoComplete="current-password"
          data-autofocus
          {...form.getInputProps("currentPassword")}
        />
        <PasswordStrength
          label="New password"
          name="new-password"
          autoComplete="new-password"
          placeholder=""
          value={form.values.newPassword}
          onChange={(value) => form.setFieldValue("newPassword", value)}
          error={newPasswordProps.error}
        />
        <PasswordInput
          label="Confirm new password"
          name="confirm-password"
          autoComplete="new-password"
          {...form.getInputProps("confirmPassword")}
        />
      </Stack>
      <Group justify="flex-end" gap="xs" mt="lg">
        <Button variant="default" onClick={close} disabled={changePassword.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={changePassword.isPending}>
          Change password
        </Button>
      </Group>
    </form>
  );
}

export default function ChangePasswordModal({ opened, close }: ChangePasswordModalProps) {
  return (
    <Modal opened={opened} onClose={close} title="Change password" centered>
      <ChangePasswordForm close={close} />
    </Modal>
  );
}
