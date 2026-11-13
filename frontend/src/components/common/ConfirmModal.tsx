import { Button, Group, Modal, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  opened: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Asks before a destructive action; the confirm button is red and the dialog stays open while it runs
export function ConfirmModal({
  opened,
  title,
  children,
  confirmLabel,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      {children && (
        <Text component="div" size="sm" mb="lg">
          {children}
        </Text>
      )}
      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button color="red" loading={loading} onClick={onConfirm} data-autofocus>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
