import { Box, Button, Group, Loader, Modal, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCamera, IconPhotoUp, IconTrash, IconX } from "@tabler/icons-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import AvatarCropModal from "@/components/account/AvatarCropModal";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/useAuthMutations";
import { AVATAR_MIME_TYPES, validateAvatarFile } from "@/utils/avatar";

const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

export default function AvatarSection() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCropOpen, { open: openCrop, close: closeCrop }] = useDisclosure(false);
  const [isConfirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const hasAvatar = Boolean(user?.avatar_url);
  const isBusy = uploadAvatar.isPending || removeAvatar.isPending;

  function openPicker() {
    inputRef.current?.click();
  }

  function startCrop(file: File) {
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
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
    openCrop();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    // Cleared so picking the same file again still fires a change
    event.currentTarget.value = "";
    if (file) startCrop(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (isBusy || !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (isBusy || !hasFiles(event)) return;
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) startCrop(file);
  }

  function handleCropExited() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handleSave(file: File) {
    uploadAvatar.mutate(file, { onSuccess: closeCrop });
  }

  function handleConfirmRemove() {
    removeAvatar.mutate(undefined, { onSuccess: closeConfirm });
  }

  return (
    <>
      <Box
        className="avatar-dropzone"
        data-dragging={isDragging || undefined}
        p="sm"
        mx="calc(var(--mantine-spacing-sm) * -1)"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Group gap="lg" wrap="nowrap" align="center">
          <UnstyledButton
            className="avatar-picker"
            data-busy={isBusy || undefined}
            disabled={isBusy}
            onClick={openPicker}
            aria-label={hasAvatar ? "Change profile picture" : "Upload a profile picture"}
          >
            <UserAvatar avatarUrl={user?.avatar_url} username={user?.username} size={88} />
            <Box component="span" className="avatar-picker-overlay">
              {isBusy ? <Loader size="sm" color="white" /> : <IconCamera size={28} stroke={1.75} />}
            </Box>
          </UnstyledButton>

          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text fw={600}>Profile Picture</Text>
            <Text size="sm" c="dimmed">
              {isDragging
                ? "Drop your photo to crop it."
                : "Click your picture or drop a photo here. PNG, JPEG, WebP or GIF."}
            </Text>
            <Group gap="xs" mt={6}>
              <Button
                size="compact-sm"
                variant="light"
                loading={uploadAvatar.isPending}
                disabled={isBusy}
                onClick={openPicker}
                leftSection={<IconPhotoUp size={16} />}
              >
                {hasAvatar ? "Change Picture" : "Upload Picture"}
              </Button>
              {hasAvatar && (
                <Button
                  size="compact-sm"
                  variant="subtle"
                  color="red"
                  disabled={isBusy}
                  onClick={openConfirm}
                  leftSection={<IconTrash size={16} />}
                >
                  Remove
                </Button>
              )}
            </Group>
          </Stack>
        </Group>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_MIME_TYPES.join(",")}
          onChange={handleInputChange}
          hidden
          tabIndex={-1}
          aria-hidden
        />
      </Box>

      <AvatarCropModal
        imageSrc={cropSrc}
        opened={isCropOpen}
        uploading={uploadAvatar.isPending}
        onCancel={closeCrop}
        onSave={handleSave}
        onExited={handleCropExited}
      />

      <Modal opened={isConfirmOpen} onClose={closeConfirm} title="Remove profile picture?" centered>
        <Group gap="md" wrap="nowrap" align="center">
          <UserAvatar avatarUrl={user?.avatar_url} username={user?.username} size={48} />
          <Text size="sm">
            Your picture will be removed and your initials will be shown instead.
          </Text>
        </Group>
        <Group justify="flex-end" gap="xs" mt="lg">
          <Button variant="default" onClick={closeConfirm} disabled={removeAvatar.isPending}>
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
