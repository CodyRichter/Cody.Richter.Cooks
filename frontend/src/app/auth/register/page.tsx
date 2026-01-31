'use client';

import {
  Alert,
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
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from register page
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);


  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const errors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return !errors.username && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    clearError();

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      router.push('/auth/login?registered=true');
    } catch {
      // Error is handled by the register hook
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
          Create Account
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Join us to start creating and sharing recipes
        </Text>

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Username"
            placeholder="Choose a username"
            required
            mb="md"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            error={formErrors.username}
          />

          <TextInput
            label="Email"
            placeholder="Enter your email address"
            type="email"
            required
            mb="md"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={formErrors.email}
          />

          <PasswordInput
            label="Password"
            placeholder="Create a strong password"
            required
            mb="xs"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            error={formErrors.password}
          />

          <Text size="xs" c="dimmed" mb="md">
            Password must be at least 8 characters long
          </Text>

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mb="md"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            error={formErrors.confirmPassword}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!formData.username || !formData.email || !formData.password || !formData.confirmPassword}
            mb="md"
          >
            Create Account
          </Button>

          <Group justify="center">
            <Text size="sm" c="dimmed">
              Already have an account?{" "}
              <Anchor
                size="sm"
                onClick={() => router.push('/auth/login')}
                style={{ cursor: "pointer" }}
              >
                Sign in here
              </Anchor>
            </Text>
          </Group>
        </form>
      </Card>
    </Container>
  );
}
