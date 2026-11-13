'use client';

import { Anchor, Badge, Box, Button, Container, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconShieldCheck } from "@tabler/icons-react";

import ApiTokensSection from "@/components/account/ApiTokensSection";
import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import EditEmailModal from "@/components/account/EditEmailModal";
import EditUsernameModal from "@/components/account/EditUsernameModal";
import ProfileHeader from "@/components/account/ProfileHeader";
import { SettingRow, SettingsSection } from "@/components/account/Settings";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { AccountSkeleton } from "@/components/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useLogoutAllSessions } from "@/hooks/useAuthMutations";

export default function AccountPage() {
  const { user } = useAuth();
  const [isUsernameOpen, usernameModal] = useDisclosure(false);
  const [isEmailOpen, emailModal] = useDisclosure(false);
  const [isPasswordOpen, passwordModal] = useDisclosure(false);
  const [isSignOutOpen, signOutModal] = useDisclosure(false);
  const signOutEverywhere = useLogoutAllSessions();

  return (
    <ProtectedRoute fallback={<AccountSkeleton />}>
      <Container size="md" px={0}>
        <Stack gap="lg">
          <Title order={1} size="h2">
            Account
          </Title>

          <SettingsSection
            title="Profile"
            action={
              user?.is_admin && (
                <Badge
                  color="red"
                  variant="light"
                  size="lg"
                  leftSection={<IconShieldCheck size={16} />}
                  style={{ flexShrink: 0 }}
                >
                  Administrator
                </Badge>
              )
            }
          >
            <ProfileHeader />
            <SettingRow
              label="Username"
              value={user?.username}
              action={
                <Button variant="default" onClick={usernameModal.open}>
                  Edit
                </Button>
              }
            />
            <SettingRow
              label="Email"
              value={user?.email}
              action={
                <Button variant="default" onClick={emailModal.open}>
                  Edit
                </Button>
              }
            />
          </SettingsSection>

          <SettingsSection title="Security">
            <SettingRow
              label="Password"
              value="••••••••"
              action={
                <Button variant="default" onClick={passwordModal.open}>
                  Change
                </Button>
              }
            />
            <Box className="settings-row">
              <Anchor component="button" type="button" size="sm" c="dimmed" onClick={signOutModal.open}>
                Sign out of all devices
              </Anchor>
            </Box>
          </SettingsSection>

          <ApiTokensSection />
        </Stack>
      </Container>

      <EditUsernameModal opened={isUsernameOpen} close={usernameModal.close} />
      <EditEmailModal opened={isEmailOpen} close={emailModal.close} />
      <ChangePasswordModal opened={isPasswordOpen} close={passwordModal.close} />
      <ConfirmModal
        opened={isSignOutOpen}
        title="Sign out of all devices?"
        confirmLabel="Sign out"
        loading={signOutEverywhere.isPending}
        onClose={signOutModal.close}
        onConfirm={() => signOutEverywhere.mutate(undefined, { onSettled: signOutModal.close })}
      >
        This includes this device, and revokes your AI assistant tokens. This can&apos;t be undone.
      </ConfirmModal>
    </ProtectedRoute>
  );
}
