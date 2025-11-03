# Cody Richter Cooks - Frontend

A modern NextJS frontend application for recipe management, integrated with a FastAPI backend.

## Prerequisites

- Node.js `v20.9.0` (LTS recommended)
- npm or yarn package manager
- Running FastAPI backend server (see backend README for setup)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NODE_ENV=development
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Backend Integration

This frontend application requires the FastAPI backend to be running. Make sure to:

1. Start the backend server first (typically on `http://localhost:8000`)
2. Ensure CORS is properly configured in the backend for `http://localhost:3000`
3. Verify the API base URL in your environment configuration

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run analyze` - Analyze bundle size
- `npm run build:analyze` - Build and analyze bundle

## Architecture

### Authentication
- JWT-based authentication with access/refresh token pattern
- Secure token storage with automatic refresh
- Protected routes with authentication guards

### State Management
- React Context + useReducer for global state
- Custom hooks for data fetching and caching
- Optimistic updates for better UX

### API Integration
- Type-safe API client with automatic token attachment
- Request deduplication and intelligent caching
- Error recovery with exponential backoff
- Comprehensive error handling

### Performance
- Code splitting and lazy loading
- Bundle optimization and tree shaking
- Progressive loading states
- Memoization for expensive operations

## Deployment

This app is configured for deployment via [Vercel](https://vercel.com) with GitHub integration.

## NextJS General Application Information

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
