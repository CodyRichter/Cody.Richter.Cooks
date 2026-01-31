'use client';

import React from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconRefresh, IconError404, IconLockX, IconWifi } from "@tabler/icons-react";
import { ApiError } from "@/types/api";

interface ApiErrorAlertProps {
    error: ApiError | Error | null;
    onRetry?: () => void;
    title?: string;
    showRetry?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function ApiErrorAlert({
    error,
    onRetry,
    title,
    showRetry = true,
    size = 'md'
}: ApiErrorAlertProps) {
    if (!error) return null;

    // Type guard for ApiError
    const isApiError = (err: ApiError | Error): err is ApiError => {
        return 'status' in err;
    };

    const apiError = isApiError(error) ? error : null;
    const status = apiError?.status;

    // Determine error type and content
    const getErrorContent = () => {
        switch (status) {
            case 404:
                return {
                    icon: <IconError404 />,
                    title: title || "Not Found",
                    message: "The requested resource could not be found. It may have been moved or deleted.",
                    color: "orange" as const
                };

            case 403:
                return {
                    icon: <IconLockX />,
                    title: title || "Access Denied",
                    message: "You don't have permission to access this resource. Please check your credentials or contact an administrator.",
                    color: "red" as const
                };

            case 401:
                return {
                    icon: <IconLockX />,
                    title: title || "Authentication Required",
                    message: "Please log in to access this resource.",
                    color: "yellow" as const
                };

            case 500:
            case 502:
            case 503:
                return {
                    icon: <IconWifi />,
                    title: title || "Server Error",
                    message: "There's a problem with our servers. Please try again in a few moments.",
                    color: "red" as const
                };

            default:
                return {
                    icon: <IconAlertTriangle />,
                    title: title || "Something went wrong",
                    message: apiError?.message || error.message || "An unexpected error occurred.",
                    color: "red" as const
                };
        }
    };

    const { icon, title: errorTitle, message, color } = getErrorContent();
    const alertSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
    const textSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';
    const buttonSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

    return (
        <Alert
            icon={React.cloneElement(icon, { size: alertSize })}
            title={errorTitle}
            color={color}
            variant="light"
        >
            <Stack gap="sm">
                <Text size={textSize}>
                    {message}
                </Text>

                {process.env.NODE_ENV === 'development' && !!apiError?.details && (
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        Status: {status} | Details: {JSON.stringify(apiError.details, null, 2)}
                    </Text>
                )}

                {showRetry && onRetry && status !== 404 && status !== 403 && (
                    <Button
                        size={buttonSize}
                        leftSection={<IconRefresh size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />}
                        onClick={onRetry}
                        variant="light"
                    >
                        Try Again
                    </Button>
                )}
            </Stack>
        </Alert>
    );
}
