import { Alert } from "@mantine/core";
import { IconLockX } from "@tabler/icons-react";

export default function InvalidPermissionAlert() {
  return (
    <Alert
      variant="filled"
      color="red"
      title="Insufficient Permissions."
      icon={<IconLockX />}
    >
      This page or action requires permissions that you do not have. Ensure that
      you are logged in and have the correct permissions to access this page. If
      you believe this is an error, please reach out to the site administrator.
    </Alert>
  );
}
