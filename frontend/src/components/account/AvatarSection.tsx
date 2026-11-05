import { Avatar, Button, FileButton, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPhotoUp, IconTrash, IconX } from "@tabler/icons-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/useAuthMutations";
import { AVATAR_MIME_TYPES, getAvatarSrc, validateAvatarFile } from "@/utils/avatar";

export default function AvatarSection() {
  const { user } = useAuth();
  const [isConfirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const avatarSrc = getAvatarSrc(user);

  function handleFileSelected(file: File | null) {
    if (!file) return;

    const problem = validateAvatarFile(file);
    if (problem) {
      notifications.show({
        title: "Cannot use that file",
        message: problem,
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }
    uploadAvatar.mutate(file);
  }

  function handleConfirmRemove() {
    removeAvatar.mutate(undefined, { onSuccess: closeConfirm });
  }

  return (
    <>
      <Group gap="md" wrap="nowrap" align="center">
        <Avatar
          src={avatarSrc}
          name={user?.username}
          color="initials"
          size={72}
          radius="xl"
          alt={user ? `${user.username}'s profile picture` : "Profile picture"}
        />
        <Stack gap={6}>
          <Group gap="xs">
            <FileButton onChange={handleFileSelected} accept={AVATAR_MIME_TYPES.join(",")}>
              {(props) => (
                <Button
                  {...props}
                  size="compact-sm"
                  variant="light"
                  loading={uploadAvatar.isPending}
                  leftSection={<IconPhotoUp size={16} />}
                >
                  {avatarSrc ? "Replace Picture" : "Upload Picture"}
                </Button>
              )}
            </FileButton>
            {avatarSrc && (
              <Button
                size="compact-sm"
                variant="subtle"
                color="red"
                onClick={openConfirm}
                leftSection={<IconTrash size={16} />}
              >
                Remove
              </Button>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            PNG, JPEG, WebP or GIF, up to 2 MB.
          </Text>
        </Stack>
      </Group>

      <Modal opened={isConfirmOpen} onClose={closeConfirm} title="Remove profile picture?">
        <Text size="sm">
          Your picture will be removed and your initials will be shown instead.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeConfirm}>
            Cancel
          </Button>
          <Button color="red" loading={removeAvatar.isPending} onClick={handleConfirmRemove}>
            Remove Picture
          </Button>
        </Group>
      </Modal>
    </>
  );
}
