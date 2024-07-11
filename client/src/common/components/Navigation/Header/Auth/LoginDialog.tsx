import { Modal } from "@mantine/core";
import React from "react";

interface LoginDialogProps {
  opened: boolean;
  close: () => void;
}

export default function LoginDialog({ opened, close }: LoginDialogProps) {
  return (
    <Modal opened={opened} onClose={close} title="Authentication">
      {/* Modal content */}
    </Modal>
  );
}
