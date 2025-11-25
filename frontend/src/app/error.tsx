'use client';

import { Container, Button, Stack } from "@mantine/core";
import { ApiErrorAlert } from "../components/error-handling";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const serverError = {
    status: 500,
    message: error.message || "Something went wrong on our end. Our team has been notified and is working to fix the issue.",
    timestamp: new Date().toISOString()
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <ApiErrorAlert
          error={serverError}
          showRetry={false}
          title="Server Error"
        />
        <Button onClick={reset} variant="light">
          Try again
        </Button>
      </Stack>
    </Container>
  );
}
