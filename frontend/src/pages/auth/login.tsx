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
import { IconAlertTriangle } from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
  });

  const validateForm = () => {
    const errors = {
      username: !formData.username ? "Username is required" : "",
      password: !formData.password ? "Password is required" : "",
    };
    setFormErrors(errors);
    return !errors.username && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    clearError();

    try {
      await login(formData.username, formData.password);
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
            label="Username"
            placeholder="Enter your username"
            required
            mb="md"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            error={formErrors.username}
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

          {error && (
            <Alert
              variant="light"
              color="red"
              icon={<IconAlertTriangle size={20} />}
              mb="md"
            >
              <Text c="red" size="sm">
                {error}
              </Text>
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!formData.username || !formData.password}
            mb="md"
          >
            Sign In
          </Button>

          <Group justify="center">
            <Text size="sm" c="dimmed">
              Don't have an account?{" "}
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