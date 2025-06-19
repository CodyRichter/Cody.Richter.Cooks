import {
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Text,
  Title,
  Tooltip,
  noop,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBrandTelegram,
  IconCircleDashedCheck,
} from "@tabler/icons-react";

import ChangePasswordModal from "@/common/components/Account/ChangePasswordModal";
import InvalidPermissionAlert from "@/common/components/ErrorMessages/InvalidPermissionAlert";
import { useAuth } from "react-oidc-context";
import { useDisclosure } from "@mantine/hooks";

export default function AccountDetailsPage() {
  const auth = useAuth();

  // Change Password Dialog State
  const [
    isChangePasswordDialogOpen,
    { toggle: toggleChangePasswordDialog, close: closeChangePasswordDialog },
  ] = useDisclosure(false);

  const username =
    (auth.user?.profile?.["cognito:username"] as string) ||
    "<Username Not Found>";

  const email = (auth.user?.profile?.email as string) || "<Email Not Found>";

  const emailVerified =
    (auth.user?.profile?.email_verified as boolean) || false;

  if (!auth.isAuthenticated) {
    return <InvalidPermissionAlert />;
  }

  return (
    <>
      <Card shadow="sm" radius="md" withBorder pb="lg">
        <Group gap="xs">
          <Title order={4}>Your Account</Title>
        </Group>
        <Text mt="md" size="sm" color="dimmed">
          From this page, you can view your account details and manage your
          profile settings.
        </Text>

        {/* // Add username */}
        <Text mt="md" size="md">
          <strong>Username:</strong> {username}
        </Text>
        <Flex
          gap="xs"
          justify="flex-start"
          align="flex-end"
          direction="row"
          wrap="wrap"
        >
          <Text mt="md" size="md">
            <strong>Email Address:</strong> {email}
          </Text>

          {emailVerified ? (
            <Tooltip label="Email Is Verified" withArrow position="right">
              <IconCircleDashedCheck color="#12b987" size={24} />
            </Tooltip>
          ) : (
            <>
              <Tooltip label="Email Is Not Verified" withArrow position="right">
                <IconAlertTriangle color="#ff5454" size={24} />
              </Tooltip>

              <Button
                size="compact-sm"
                variant="subtle"
                className="verifyEmailButton"
                onClick={() => noop()}
                rightSection={<IconBrandTelegram size={16} />}
              >
                Send Verification Email
              </Button>
            </>
          )}
        </Flex>

        <Divider my="md" />

        <Flex
          gap="xs"
          justify="flex-start"
          align="flex-end"
          direction="row"
          wrap="wrap"
        >
          {/* Change Password (This will use the Cognito UI) */}
          <Text mt="md" size="md">
            <strong>Password:</strong>
          </Text>
          <Button
            size="compact-sm"
            variant="subtle"
            onClick={toggleChangePasswordDialog}
          >
            Change Password
          </Button>
        </Flex>
      </Card>

      <ChangePasswordModal
        opened={isChangePasswordDialogOpen}
        close={closeChangePasswordDialog}
      />
    </>
  );
}
