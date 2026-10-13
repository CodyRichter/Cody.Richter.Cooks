'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button, Card, Container, Text, TextInput, PasswordInput, Title, Anchor, Group } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/apiClient';
import { FormCardSkeleton } from '@/components/loading';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: verification, isLoading: isVerifying } = useQuery({
    queryKey: ['reset-password-verify', token],
    queryFn: () =>
      apiClient.get<{ username: string }>(
        `/api/v1/users/reset-password/verify/?token=${encodeURIComponent(token ?? '')}`,
        false
      ),
    enabled: !!token,
    retry: false,
  });
  const username = verification?.username ?? null;

  const mutation = useMutation({
    mutationFn: async (data: { token: string; new_password: string }) => {
      const response = await apiClient.post<{ message: string }>('/api/v1/users/reset-password/', data, false);
      return response;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Your password has been successfully reset. You can now log in.',
        color: 'green',
      });
      router.push('/auth/login');
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An error occurred. The link might be invalid or expired.',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      notifications.show({ message: 'Invalid or missing reset token. Please request a new link.', color: 'red' });
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({ message: 'Passwords do not match', color: 'red' });
      return;
    }

    if (password.length < 8) {
      notifications.show({ message: 'Password must be at least 8 characters long', color: 'red' });
      return;
    }

    mutation.mutate({ token, new_password: password });
  };

  if (isVerifying) {
    return <FormCardSkeleton fields={3} />;
  }

  if (!token || !username) {
    return (
      <Container size="xs" mt="xl">
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Title order={3} ta="center" mb="md" c="red">
            Invalid Reset Link
          </Title>
          <Text ta="center" mb="xl">
            This password reset link is invalid or missing. Please request a new one.
          </Text>
          <Button fullWidth component={Link} href="/auth/forgot-password">
            Request New Link
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xs" mt="xl">
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Title order={2} ta="center" mb="md">
          Choose a New Password
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Enter your new password below.
        </Text>

        <form onSubmit={handleSubmit}>
          {/* Hidden username field for password managers */}
          <input
            type="text"
            name="username"
            value={username || ''}
            readOnly
            autoComplete="username"
            style={{ display: 'none' }}
          />

          <TextInput
            label="Account Username"
            value={username || ''}
            readOnly
            disabled
            mb="md"
            variant="filled"
            styles={{
              input: {
                fontWeight: 600,
                color: 'var(--mantine-color-blue-filled)',
              }
            }}
          />

          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            required
            autoComplete="new-password"
            mb="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            mb="xl"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            loading={mutation.isPending}
            disabled={!password || !confirmPassword}
            mb="md"
          >
            Reset Password
          </Button>

          <Group justify="center">
            <Anchor
              size="sm"
              component={Link}
              href="/auth/login"
              c="dimmed"
            >
              Back to Login
            </Anchor>
          </Group>
        </form>
      </Card>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FormCardSkeleton fields={3} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
