import { Container } from "@mantine/core";
import { ApiErrorAlert } from "../components/error-handling";

export default function Custom500() {
    const serverError = {
        status: 500,
        message: "Something went wrong on our end. Our team has been notified and is working to fix the issue.",
        timestamp: new Date().toISOString()
    };

    return (
        <Container size="md" py="xl">
            <ApiErrorAlert
                error={serverError}
                showRetry={true}
                title="Server Error"
            />
        </Container>
    );
}