'use client';

import { useState } from 'react';
import { Button, Card, Container, Text, TextInput, Title, Anchor, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { Turnstile } from '@marsidev/react-turnstile';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/utils/apiClient';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: { email: string; captcha_token: string }) => {
      const response = await apiClient.post('/api/v1/users/forgot-password/', data, false);
      return response;
    },
    onSuccess: (data: { message?: string }) => {
      notifications.show({
        title: 'Check your email',
        message: data.message || 'If an account exists, a reset link has been sent.',
        color: 'blue',
      });
      router.push('/auth/login');
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An error occurred. Please try again.',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      notifications.show({ message: 'Please enter your email', color: 'red' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notifications.show({ message: 'Please enter a valid email address', color: 'red' });
      return;
    }

    if (!captchaToken) {
      notifications.show({ message: 'Please complete the captcha', color: 'red' });
      return;
    }

    mutation.mutate({ email, captcha_token: captchaToken });
  };

  return (
    <Container size="xs" mt="xl">
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Title order={2} ta="center" mb="md">
          Reset Password
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Enter your email address and we will send you a link to reset your password.
        </Text>

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email Address"
            placeholder="Enter your email"
            type="email"
            required
            mb="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Group justify="center" mb="md">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setCaptchaToken(token)}
            />
          </Group>

          <Button
            type="submit"
            fullWidth
            loading={mutation.isPending}
            disabled={!email || !captchaToken}
            mb="md"
          >
            Send Reset Link
          </Button>

          <Group justify="center">
            <Anchor
              size="sm"
              onClick={() => router.push('/auth/login')}
              style={{ cursor: "pointer" }}
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
