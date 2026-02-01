'use client';

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
  Loader,
  Center,
} from "@mantine/core";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const { login, isLoading, clearError, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Show registration success notification
  useEffect(() => {
    if (isRegistered) {
      // Clear the query param to avoid confusion, notification is now handled by AuthContext during the registration action
      router.replace('/auth/login', { scroll: false });
    }
  }, [isRegistered, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    clearError();

    try {
      await login(formData.identifier, formData.password);
      router.push('/');
    } catch {
      // Error is handled by the login hook
    }
  };

  // Don't render if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
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
            label="Password"
            placeholder="Enter your password"
            required
            mb="md"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            error={formErrors.password}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!formData.identifier || !formData.password}
            mb="md"
          >
            Sign In
          </Button>

          <Group justify="center">


            <Text size="sm" c="dimmed">
              Don&apos;t have an account?{" "}
              <Anchor
                size="sm"
                onClick={() => router.push('/auth/register')}
                style={{ cursor: "pointer" }}
              >
                Create one here
              </Anchor>
            </Text>
          </Group>
        </form>
      </Card>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container size="xs" mt="xl">
        <Center>
          <Loader size="xl" />
        </Center>
      </Container>
    }>
      <LoginForm />
    </Suspense>
  );
}
