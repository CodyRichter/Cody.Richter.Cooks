import { Button, Group, Modal, PasswordInput, Stack, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useAuthMutations";
import { formatNotificationError } from "@/utils/notificationUtils";

interface EditEmailModalProps {
  opened: boolean;
  close: () => void;
}

interface EmailValues {
  email: string;
  currentPassword: string;
}

function EditEmailForm({ close }: { close: () => void }) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const form = useForm<EmailValues>({
    initialValues: { email: user?.email ?? "", currentPassword: "" },
    validate: {
      email: isEmail("Enter a valid email address"),
      currentPassword: isNotEmpty("Enter your current password"),
    },
  });

  const unchanged = form.values.email.trim().toLowerCase() === user?.email.toLowerCase();

  function handleSubmit({ email, currentPassword }: EmailValues) {
    updateProfile.mutate(
      { email: email.trim(), current_password: currentPassword },
      {
        onSuccess: () => {
          notifications.show({
            title: "Email updated",
            message: `We'll use ${email.trim()} from now on.`,
            color: "green",
            icon: <IconCheck size={18} />,
          });
          close();
        },
        onError: (error) => {
          const message = formatNotificationError(error);
          form.setFieldError(/password/i.test(message) ? "currentPassword" : "email", message);
        },
      }
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          data-autofocus
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          {...form.getInputProps("currentPassword")}
        />
      </Stack>
      <Group justify="flex-end" gap="xs" mt="lg">
        <Button variant="default" onClick={close} disabled={updateProfile.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={updateProfile.isPending} disabled={unchanged}>
          Save
        </Button>
      </Group>
    </form>
  );
}

export default function EditEmailModal({ opened, close }: EditEmailModalProps) {
  return (
    <Modal opened={opened} onClose={close} title="Change email" centered>
      <EditEmailForm close={close} />
    </Modal>
  );
}
