'use client';

import { Loader } from '@mantine/core';
import { useLinkStatus } from 'next/link';
import { ReactNode } from 'react';

interface LinkPendingIconProps {
  icon: ReactNode;
  size?: number;
}

// Must render inside a next/link: swaps the link's icon for a spinner while its route loads
export function LinkPendingIcon({ icon, size = 16 }: LinkPendingIconProps) {
  const { pending } = useLinkStatus();
  return pending ? <Loader size={size} color="orange" /> : icon;
}
