import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useAuthMutations";
import { formatNotificationError } from "@/utils/notificationUtils";

interface EditUsernameModalProps {
  opened: boolean;
  close: () => void;
}

function EditUsernameForm({ close }: { close: () => void }) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const form = useForm({
    initialValues: { username: user?.username ?? "" },
    validate: {
      username: (value) => {
        const length = value.trim().length;
        return length < 3 || length > 50 ? "Use 3 to 50 characters" : null;
      },
    },
  });

  const unchanged = form.values.username.trim() === user?.username;

  function handleSubmit({ username }: { username: string }) {
    updateProfile.mutate(
      { username: username.trim() },
      {
        onSuccess: () => {
          notifications.show({
            title: "Username updated",
            message: `You're now ${username.trim()}.`,
            color: "green",
            icon: <IconCheck size={18} />,
          });
          close();
        },
        onError: (error) => form.setFieldError("username", formatNotificationError(error)),
      }
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <TextInput
        label="Username"
        autoComplete="username"
        maxLength={50}
        data-autofocus
        {...form.getInputProps("username")}
      />
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

export default function EditUsernameModal({ opened, close }: EditUsernameModalProps) {
  return (
    <Modal opened={opened} onClose={close} title="Change username" centered>
      <EditUsernameForm close={close} />
    </Modal>
  );
}
