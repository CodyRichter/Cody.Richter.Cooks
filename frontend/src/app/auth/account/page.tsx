'use client';

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
  Badge,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBrandTelegram,
  IconCircleDashedCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useDisclosure } from "@mantine/hooks";

export default function AccountDetailsPage() {
  const auth = useAuth();

  // Change Password Dialog State
  const [
    isChangePasswordDialogOpen,
    { toggle: toggleChangePasswordDialog, close: closeChangePasswordDialog },
  ] = useDisclosure(false);

  const username = auth.user?.username || "<Username Not Found>";
  const email = auth.user?.email || "<Email Not Found>";
  const isAdmin = auth.user?.is_admin || false;

  // For now, assume email is verified since we don't have email verification in the backend yet
  const emailVerified = true;

  return (
    <ProtectedRoute>
      <Card shadow="sm" radius="md" withBorder pb="lg">
        <Group gap="xs">
          <Title order={4}>Account</Title>
          {isAdmin && (
            <Badge color="red" variant="light" leftSection={<IconShieldCheck size={14} />}>
              Administrator
            </Badge>
          )}
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
          {/* Change Password using JWT API */}
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
    </ProtectedRoute>
  );
}
