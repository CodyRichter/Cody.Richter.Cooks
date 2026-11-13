import { Box, Group, Loader, Menu, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCamera, IconPencil, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import AvatarCropModal from "@/components/account/AvatarCropModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRemoveAvatar, useUploadAvatar } from "@/hooks/useAuthMutations";
import { AVATAR_MIME_TYPES, validateAvatarFile } from "@/utils/avatar";

const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

// The account's identity: picture (click or drop a photo to change it), username and join date
export default function ProfileHeader() {
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
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

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

  const avatarButton = (
    <UnstyledButton
      className="avatar-picker"
      data-busy={isBusy || undefined}
      disabled={isBusy}
      onClick={hasAvatar ? undefined : openPicker}
      aria-label={hasAvatar ? "Edit profile picture" : "Add a profile picture"}
    >
      <UserAvatar avatarUrl={user?.avatar_url} username={user?.username} size={80} decorative />
      <Box component="span" className="avatar-picker-overlay">
        {isBusy ? <Loader size="sm" color="white" /> : <IconCamera size={24} stroke={1.75} />}
      </Box>
      <Box component="span" className="avatar-picker-badge">
        <IconPencil size={14} />
      </Box>
    </UnstyledButton>
  );

  return (
    <Box className="settings-row">
      <Group
        className="avatar-dropzone"
        data-dragging={isDragging || undefined}
        gap="lg"
        wrap="nowrap"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasAvatar ? (
          <Menu position="bottom-start" shadow="md">
            <Menu.Target>{avatarButton}</Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUpload size={16} />} onClick={openPicker}>
                Upload new picture
              </Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={openConfirm}>
                Remove picture
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          avatarButton
        )}

        <Box miw={0}>
          <Text fw={600} size="xl" truncate>
            {user?.username}
          </Text>
          {memberSince && (
            <Text size="sm" c="dimmed">
              Member since {memberSince}
            </Text>
          )}
        </Box>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_MIME_TYPES.join(",")}
          onChange={handleInputChange}
          hidden
          tabIndex={-1}
          aria-hidden
        />
      </Group>

      <AvatarCropModal
        imageSrc={cropSrc}
        opened={isCropOpen}
        uploading={uploadAvatar.isPending}
        onCancel={closeCrop}
        onSave={(file) => uploadAvatar.mutate(file, { onSuccess: closeCrop })}
        onExited={handleCropExited}
      />

      <ConfirmModal
        opened={isConfirmOpen}
        title="Remove profile picture?"
        confirmLabel="Remove"
        loading={removeAvatar.isPending}
        onClose={closeConfirm}
        onConfirm={() => removeAvatar.mutate(undefined, { onSuccess: closeConfirm })}
      />
    </Box>
  );
}
