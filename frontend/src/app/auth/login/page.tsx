'use client';

import Link from "next/link";
import {
  Button,
  Card,
  Container,
  Group,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Anchor,
} from "@mantine/core";
import { GuestRoute } from "@/components/auth/ProtectedRoute";
import { useLogin } from "@/hooks/useAuthMutations";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    identifier: "",
    password: "",
  });

  const validateForm = () => {
    const errors = {
      identifier: !formData.identifier
        ? "Email or Username is required"
        : formData.identifier.length < 3
          ? "Must be at least 3 characters"
          : "",
      password: !formData.password ? "Password is required" : "",
    };
    setFormErrors(errors);
    return !errors.identifier && !errors.password;
  };

  // GuestRoute redirects once the session is set
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !captchaToken) return;
    login(
      { username: formData.identifier, password: formData.password, captcha_token: captchaToken },
      {
        // Captcha tokens are single-use, so a failed attempt needs a fresh one
        onError: () => {
          setCaptchaToken(null);
          turnstileRef.current?.reset();
        },
      }
    );
  };

  return (
    <GuestRoute>
      <Container size="xs" mt="xl">
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Title order={2} ta="center" mb="md">
            Welcome Back
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb="xl">
            Sign in to your account to continue
          </Text>

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email or Username"
              placeholder="Enter your email or username"
              required
              mb="md"
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              error={formErrors.identifier}
            />

            <PasswordInput
              label={
                <Group justify="space-between" style={{ width: '100%', marginBottom: 2 }}>
                  <Text size="sm" fw={500}>
                    Password <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
                  </Text>
                  <Anchor
                    size="xs"
                    component={Link}
                    href="/auth/forgot-password"
                    fw={400}
                  >
                    Forgot your password?
                  </Anchor>
                </Group>
              }
              placeholder="Enter your password"
              required
              withAsterisk={false}
              mb="md"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              error={formErrors.password}
            />

            <Group justify="center" mb="md">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                options={{
                  appearance: 'execute',
                }}
              />
            </Group>

            <Button
              type="submit"
              fullWidth
              loading={isPending}
              disabled={!formData.identifier || !formData.password || !captchaToken}
              mb="md"
            >
              Sign In
            </Button>

            <Group justify="center">


              <Text size="sm" c="dimmed">
                Don&apos;t have an account?{" "}
                <Anchor
                  size="sm"
                  component={Link}
                  href="/auth/register"
                >
                  Create one here
                </Anchor>
              </Text>
            </Group>
          </form>
        </Card>
      </Container>
    </GuestRoute>
  );
}
