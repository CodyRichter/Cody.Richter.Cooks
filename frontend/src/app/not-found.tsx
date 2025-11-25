import { Container } from "@mantine/core";
import { ApiErrorAlert } from "../components/error-handling";

export default function NotFound() {
    const notFoundError = {
        status: 404,
        message: "The page you are looking for could not be found. It may have been moved, deleted, or you entered the wrong URL.",
        timestamp: new Date().toISOString()
    };

    return (
        <Container size="md" py="xl">
            <ApiErrorAlert
                error={notFoundError}
                showRetry={false}
                title="Page Not Found"
            />
        </Container>
    );
}
