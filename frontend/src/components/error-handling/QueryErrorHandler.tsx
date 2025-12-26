import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import ApiErrorAlert from '@/components/error-handling/ApiErrorAlert';
import { ApiError } from '@/utils/apiClient';

interface QueryErrorHandlerProps<T> {
    query: UseQueryResult<T, ApiError | Error>;
    onRetry?: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export default function QueryErrorHandler<T>({
    query,
    onRetry,
    title,
    size = 'md',
    children
}: QueryErrorHandlerProps<T>) {
    if (query.isError) {
        return (
            <ApiErrorAlert
                error={query.error}
                onRetry={onRetry || query.refetch}
                title={title}
                size={size}
            />
        );
    }

    return <>{children}</>;
}
