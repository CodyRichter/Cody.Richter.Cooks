# AGENTS.md (Frontend)

> [!NOTE]
> This document guides AI agents on working within the `frontend/` directory.

## 1. Core Technology Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/docs)
- **UI System**: [Mantine UI v9](https://mantine.dev/)
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
Ensure Node 24 is active (run `nvm use` in repository root or `frontend/`). Run these commands from the `frontend/` directory:

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build check (MANDATORY before commit)
npm run lint     # Run ESLint (MANDATORY before commit)
```

### Best Practices

> [!IMPORTANT]
> You MUST ensure `npm run build` and `npm run lint` pass without errors before considering a task complete. This prevents broken builds and maintains code quality.

1.  **Server Components vs Client Components**:
    - Default to **Server Components** (`page.tsx`, `layout.tsx`) for fetching and layout.
    - Use **Client Components** (`'use client'`) only when you need interactivity (onClick, useState, hooks).
2.  **Data Fetching**:
    - **Server**: Use `await fetch` or direct DB calls (if applicable) in Server Components.
    - **Client**: Use `useQuery` hooks.
3.  **Performance**:
    - Use `next/image` for all images.
    - Avoid large imports in Client Components.

### Navigation, Loading & Interaction Rules

> [!IMPORTANT]
> These keep navigation instant and the UI stable. Follow them for every new page and component.

1.  **Navigate with `<Link>`**: Every in-app navigation is a `next/link` (`component={Link} href=…` on Mantine `NavLink`, `Card`, `Button`, `ActionIcon`, `Menu.Item`, `Anchor`). Only `<Link>` prefetches, and a dynamic route shows its `loading.tsx` instantly only when prefetched. Reserve `router.push`/`replace` for redirects after a mutation or auth change.
2.  **Pending feedback**: Put `LinkPendingIcon` (`components/navigation/LinkPendingIcon.tsx`) in a link's icon slot so the icon becomes a spinner while its route loads. Clickable cards use the `.interactive-card` class (hover, focus, press and pending styles live in `styles/styles.css`).
3.  **Route-level loading**: A skeleton shaped like the final page, from `loading.tsx` or the required `ProtectedRoute` `fallback`. Skeletons live in `components/loading/`. Never show a centered spinner for page content.
4.  **Refreshing in place** (pagination, search): Keep the current content on screen with `className="refreshable" data-refreshing={…}`. Never collapse it back to a skeleton.
5.  **Actions**: Use the `Button`/`ActionIcon` `loading` prop.
6.  **No late inserts**: Anything that arrives later either reserves its space or renders only once known. Prefer data the server already has (e.g. the recipe owner passed to `useUserRecipePermissions`) over a client fetch.
7.  **Errors**: Use `ApiErrorAlert`.

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
- **SEO**: Export `metadata` (or `generateMetadata`) from server `page.tsx`/`layout.tsx` files. Recipe pages (`app/recipes/view/[recipe_id]/page.tsx`) are server components with ISR: they fetch via `utils/recipeServer.ts`, emit OpenGraph metadata and schema.org `Recipe` JSON-LD (`utils/recipeStructuredData.ts`), and hand the data to the client `RecipeView` as `initialData`. `app/sitemap.ts` and `app/robots.ts` cover crawlers.
- **Server rendering**: Do not wrap the app shell in client-only gates; that disables SSR for every page. Use hydration-safe hooks (e.g. Mantine `useMediaQuery` with `getInitialValueInEffect`) for browser-only values.
- **Secrets**: NEVER hardcode API keys. Use `process.env.NEXT_PUBLIC_...` for public keys (like `NEXT_PUBLIC_TURNSTILE_SITE_KEY`), and keep private keys server-side.
- **Bot Protection**: Use `@marsidev/react-turnstile` for CAPTCHA protection on sensitive forms (registration, forgot password). Turnstile tokens are single-use; reset the widget after a failed submit.
- **Rendering HTML**: Pass user-authored HTML through `sanitizeHtml` (`src/utils/sanitizeHtml.ts`) before `dangerouslySetInnerHTML` or `html-react-parser`.
- **Auth tokens**: `src/utils/auth.ts` is the only module that touches token storage. `apiClient` refreshes on 401 through `refreshSession()` (deduplicated, because refresh tokens rotate) and calls `endSession()` when a refresh is rejected, which logs `AuthContext` out via `SESSION_EXPIRED_EVENT`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
