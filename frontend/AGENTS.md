# AGENTS.md (Frontend)

> [!NOTE]
> This document guides AI agents on working within the `frontend/` directory.

## 1. Core Technology Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/docs)
- **UI System**: [Mantine UI v8](https://mantine.dev/)
  - Use `@mantine/core`, `@mantine/hooks` for everything.
  - **Notifications**: Prefer `notifications.show()` from `@mantine/notifications` for user feedback (success/error/info) instead of creating custom state-managed boxes or alert components.
  - **Avoid** raw CSS or Tailwind unless absolutely necessary. Prefer Mantine's style props or `style` object.
- **State Management**: [React Query](https://tanstack.com/query/latest) (`@tanstack/react-query`)
  - **Rule**: All server data fetching MUST use React Query. Do not use `useEffect` + `fetch` manually.
- **Editor**: [Tiptap](https://tiptap.dev/) for rich text.

## 2. Directory Structure (`src/`)
- `app/`: Next.js App Router pages and layouts.
  - `page.tsx`: Route entry point.
  - `layout.tsx`: Wrappers.
  - `loading.tsx`: Suspense fallbacks.
- `components/`: Reusable UI components.
  - Group by feature if specific (e.g., `components/recipes/`), or generic (e.g., `components/ui/`).
- `hooks/`: Custom React hooks (business logic).
- `lib/`: Utilities, API clients (Axios/Fetch wrappers), Zod schemas.

## 3. Development Workflow
Run these commands from the `frontend/` directory:

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build check
npm run lint     # Run ESLint to catch errors
```

### Best Practices
1.  **Server Components vs Client Components**:
    - Default to **Server Components** (`page.tsx`, `layout.tsx`) for fetching and layout.
    - Use **Client Components** (`'use client'`) only when you need interactivity (onClick, useState, hooks).
2.  **Data Fetching**:
    - **Server**: Use `await fetch` or direct DB calls (if applicable) in Server Components.
    - **Client**: Use `useQuery` hooks.
3.  **Performance**:
    - Use `next/image` for all images.
    - Avoid large imports in Client Components.

## 4. Common Tasks
- **Creating a Component**: Use the standard template:
  ```tsx
  import { Box, Text } from '@mantine/core';

  interface MyComponentProps {
    title: string;
  }

  export function MyComponent({ title }: MyComponentProps) {
    return (
      <Box>
        <Text>{title}</Text>
      </Box>
    );
  }
  ```
- **Adding a Page**: Create `src/app/path/to/page.tsx`. Ensure it exports a default function.

## 5. Security & SEO
- **SEO**: Export `metadata` object from `page.tsx` or `layout.tsx`.
- **Secrets**: NEVER hardcode API keys. Use `process.env.NEXT_PUBLIC_...` for public keys, and kept private keys server-side.
