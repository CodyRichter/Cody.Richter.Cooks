# Design Document

## Overview

This design outlines the migration of the NextJS frontend application from AWS Lambda/Cognito/DynamoDB architecture to integrate with the FastAPI/Postgres backend. The migration will replace AWS-specific authentication and API calls while maintaining the existing Mantine.dev UI components and user experience.

## Architecture

### Current State Analysis
- **Frontend**: NextJS with Mantine.dev components, using AWS Cognito for auth and Lambda API Gateway
- **Backend**: FastAPI with JWT authentication, Postgres database, comprehensive recipe and user management
- **Dependencies**: AWS SDK, Cognito Identity JS, OIDC client libraries

### Target Architecture
- **Frontend**: NextJS with Mantine.dev (preserved), JWT token-based authentication
- **Backend**: FastAPI REST API with standardized endpoints
- **Authentication**: JWT access/refresh token pattern
- **Data Flow**: Direct HTTP calls to FastAPI endpoints

## Components and Interfaces

### Modern React Architecture

#### State Management Strategy
- **React Context + useReducer**: Global authentication state
- **Custom Hooks**: Encapsulate data fetching and state logic
- **React Query/SWR Alternative**: Custom hook-based caching for API calls
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Suspense Boundaries**: Proper loading state management

#### Component Architecture
- **Compound Components**: Complex UI components with multiple parts
- **Render Props/Custom Hooks**: Reusable logic patterns
- **Error Boundaries**: Graceful error handling at component level
- **Lazy Loading**: Code splitting for better performance

### Authentication System

#### Current Implementation
- Uses `react-oidc-context` and `amazon-cognito-identity-js`
- OIDC flow with Cognito authority
- Token stored in OIDC context

#### New Implementation
- React Context with useReducer for auth state
- Custom hooks for authentication operations
- Persistent token storage with automatic refresh
- Optimistic authentication updates

#### Authentication Context Interface
```typescript
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (userData: UserRegistration) => Promise<void>
  logout: () => void
  clearError: () => void
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_ERROR'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
```

#### Custom Authentication Hooks
```typescript
// Primary auth hook
const useAuth = () => useContext(AuthContext)

// Specialized hooks
const useLogin = () => {
  const { login, isLoading, error } = useAuth()
  return { login, isLoading, error }
}

const useProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  // Handle redirect logic
}
```

### Smart Data Fetching & Caching

#### Current Implementation Issues
- Direct fetch calls with hardcoded AWS Lambda URLs
- Inconsistent error handling
- Manual token attachment
- No caching or deduplication
- Unnecessary re-fetches on navigation

#### New Implementation Strategy
- **Custom Hook-Based Data Fetching**: Encapsulate API calls in reusable hooks
- **Intelligent Caching**: Cache responses with TTL and invalidation strategies
- **Request Deduplication**: Prevent duplicate simultaneous requests
- **Optimistic Updates**: Immediate UI updates with server sync
- **Background Refresh**: Keep data fresh without blocking UI

#### Data Fetching Hooks
```typescript
// Generic data fetching hook with caching
interface UseApiOptions<T> {
  enabled?: boolean
  cacheTime?: number
  staleTime?: number
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
}

const useApiQuery = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseApiOptions<T>
) => {
  // Implementation with caching, deduplication, error handling
  return {
    data: T | undefined
    isLoading: boolean
    error: ApiError | null
    refetch: () => Promise<void>
    invalidate: () => void
  }
}

// Specialized hooks for different resources
const useRecipes = (params?: RecipeSearchParams) => {
  return useApiQuery(
    ['recipes', params],
    () => apiClient.recipes.list(params),
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  )
}

const useRecipe = (id: string) => {
  return useApiQuery(
    ['recipe', id],
    () => apiClient.recipes.get(id),
    { enabled: !!id }
  )
}

const useMyRecipes = () => {
  const { isAuthenticated } = useAuth()
  return useApiQuery(
    ['my-recipes'],
    () => apiClient.recipes.getMyRecipes(),
    { enabled: isAuthenticated }
  )
}
```

#### Mutation Hooks with Optimistic Updates
```typescript
const useCreateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipe: RecipeCreate) => apiClient.recipes.create(recipe),
    onMutate: async (newRecipe) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['my-recipes'])

      // Snapshot previous value
      const previousRecipes = queryClient.getQueryData(['my-recipes'])

      // Optimistically update
      queryClient.setQueryData(['my-recipes'], (old: RecipeListItem[]) => [
        { ...newRecipe, id: 'temp-id', created_at: new Date().toISOString() },
        ...old
      ])

      return { previousRecipes }
    },
    onError: (err, newRecipe, context) => {
      // Rollback on error
      queryClient.setQueryData(['my-recipes'], context?.previousRecipes)
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['my-recipes'])
    }
  })
}
```

#### API Client with Smart Features
```typescript
class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private pendingRequests = new Map<string, Promise<any>>()

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; key?: string }
  ): Promise<T> {
    const cacheKey = cacheOptions?.key || `${options.method || 'GET'}:${endpoint}`

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data
    }

    // Deduplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Make request with automatic token attachment
    const request = this.makeRequest<T>(endpoint, options)
    this.pendingRequests.set(cacheKey, request)

    try {
      const result = await request

      // Cache successful responses
      if (cacheOptions?.ttl) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheOptions.ttl
        })
      }

      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  // Invalidate cache entries
  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

### Data Models Update

#### Current Models Issues
- Missing fields (cooking_time, serving_size, order_index, step_number, timing)
- Inconsistent ID handling
- No proper typing for API responses

#### Updated Models
```typescript
// User Models
interface User {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

// Recipe Models
interface Recipe {
  id: string
  title: string
  description?: string
  tags: string[]
  cooking_time?: number
  serving_size?: number
  created_at: string
  updated_at: string
}

interface RecipeDetail extends Recipe {
  ingredients: Ingredient[]
  instructions: Instruction[]
}

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  subtext?: string
  order_index: number
  recipe_id: string
}

interface Instruction {
  id: string
  title: string
  description: string
  step_number: number
  timing?: number
  recipe_id: string
}
```

### Environment Configuration

#### Development Configuration
```typescript
interface AppConfig {
  apiBaseUrl: string
  environment: 'development' | 'production'
  tokenStorageKey: string
  refreshTokenStorageKey: string
}
```

## Error Handling & Loading States

### Comprehensive Error Management

#### Error Types & Responses
```typescript
interface ApiError {
  message: string
  status: number
  code?: string
  details?: any
  timestamp: string
}

interface NetworkError extends ApiError {
  type: 'network'
  retryable: boolean
  retryCount: number
}

interface ValidationError extends ApiError {
  type: 'validation'
  fieldErrors: Record<string, string[]>
}

interface AuthenticationError extends ApiError {
  type: 'authentication'
  requiresLogin: boolean
}
```

#### Error Boundary Strategy
```typescript
// Global error boundary for unhandled errors
const GlobalErrorBoundary: React.FC = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<GlobalErrorFallback />}
      onError={(error, errorInfo) => {
        // Log to monitoring service
        console.error('Global error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Feature-specific error boundaries
const RecipeErrorBoundary: React.FC = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<RecipeErrorFallback />}
      onError={(error) => {
        // Handle recipe-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

#### Smart Error Recovery
```typescript
const useErrorRecovery = () => {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleError = useCallback(async (error: ApiError, retryFn: () => Promise<any>) => {
    if (error.status >= 500 && retryCount < maxRetries) {
      // Exponential backoff for server errors
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      setRetryCount(prev => prev + 1)
      return retryFn()
    }

    if (error.status === 401) {
      // Handle authentication errors
      const { refreshToken } = useAuth()
      try {
        await refreshToken()
        return retryFn()
      } catch {
        // Redirect to login
        window.location.href = '/login'
      }
    }

    // Show user-friendly error
    showNotification({
      type: 'error',
      message: getErrorMessage(error)
    })
  }, [retryCount])

  return { handleError, retryCount, canRetry: retryCount < maxRetries }
}
```

### Advanced Loading States

#### Loading State Management
```typescript
interface LoadingState {
  isLoading: boolean
  loadingType: 'initial' | 'refresh' | 'loadMore' | 'mutation'
  progress?: number
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({})

  const setLoading = useCallback((key: string, state: Partial<LoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...state }
    }))
  }, [])

  const isAnyLoading = useMemo(() =>
    Object.values(loadingStates).some(state => state.isLoading),
    [loadingStates]
  )

  return { loadingStates, setLoading, isAnyLoading }
}
```

#### Smart Loading Components
```typescript
// Skeleton loader that matches actual content
const RecipeCardSkeleton: React.FC = () => (
  <Card>
    <Skeleton height={200} radius="md" />
    <Skeleton height={20} mt="md" />
    <Skeleton height={16} mt="xs" width="70%" />
  </Card>
)

// Progressive loading for lists
const RecipeList: React.FC = () => {
  const { data: recipes, isLoading, hasNextPage, fetchNextPage } = useInfiniteRecipes()

  return (
    <div>
      {recipes?.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}

      {isLoading && (
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <IntersectionObserver onIntersect={fetchNextPage}>
          <div>Loading more...</div>
        </IntersectionObserver>
      )}
    </div>
  )
}
```

### Navigation Without Page Reloads

#### Client-Side Navigation Strategy
```typescript
// Custom navigation hook with state preservation
const useAppNavigation = () => {
  const router = useRouter()

  const navigateToRecipe = useCallback((recipeId: string, recipe?: Recipe) => {
    // Prefetch data if not already cached
    if (recipe) {
      queryClient.setQueryData(['recipe', recipeId], recipe)
    }

    // Navigate without full page reload
    router.push(`/recipes/view/${recipeId}`)
  }, [router])

  const navigateWithState = useCallback((path: string, state?: any) => {
    // Preserve scroll position and form state
    const currentState = {
      scrollY: window.scrollY,
      formData: getCurrentFormData(),
      ...state
    }

    sessionStorage.setItem('navigationState', JSON.stringify(currentState))
    router.push(path)
  }, [router])

  return { navigateToRecipe, navigateWithState }
}
```

#### Optimistic Navigation
```typescript
// Navigate immediately while data loads in background
const RecipeCard: React.FC<{ recipe: RecipeListItem }> = ({ recipe }) => {
  const { navigateToRecipe } = useAppNavigation()
  const { prefetch } = useRecipe(recipe.id)

  const handleClick = () => {
    // Start navigation immediately
    navigateToRecipe(recipe.id, recipe)

    // Prefetch full recipe data in background
    prefetch()
  }

  return (
    <Card onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Recipe card content */}
    </Card>
  )
}

## Testing Strategy

### Unit Testing
- Authentication service methods
- API client functions
- Data transformation utilities
- Form validation logic

### Integration Testing
- Authentication flow end-to-end
- Recipe CRUD operations
- Error handling scenarios
- Token refresh mechanism

### Component Testing
- Login/register forms
- Recipe creation/editing forms
- Navigation components
- Error boundary components

## Performance Optimization Strategy

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Remove unused AWS dependencies completely
- **Dynamic Imports**: Lazy load heavy components (TipTap editor, etc.)
- **Bundle Analysis**: Monitor bundle size changes during migration

### Runtime Performance
- **Memoization**: React.memo, useMemo, useCallback for expensive operations
- **Virtual Scrolling**: For large recipe lists
- **Image Optimization**: Next.js Image component with proper sizing
- **Prefetching**: Intelligent prefetching based on user behavior

### Network Optimization
- **Request Batching**: Combine multiple API calls when possible
- **Compression**: Enable gzip/brotli compression
- **CDN Integration**: Serve static assets from CDN
- **Service Worker**: Cache API responses and enable offline functionality

## Migration Implementation Plan

### Phase 1: Foundation & Modern React Setup
1. Remove AWS dependencies from package.json
2. Set up modern React patterns (Context + useReducer)
3. Create custom hooks architecture
4. Implement error boundaries and loading states
5. Set up environment configuration with proper typing

### Phase 2: Smart Data Layer
1. Create intelligent API client with caching
2. Implement custom data fetching hooks
3. Set up request deduplication and background refresh
4. Create optimistic update patterns
5. Implement proper error recovery mechanisms

### Phase 3: Authentication Overhaul
1. Replace OIDC with JWT-based auth context
2. Implement secure token storage and refresh
3. Create authentication hooks and guards
4. Update all protected routes and components
5. Add proper logout and session management

### Phase 4: API Integration & Optimization
1. Update all recipe API calls with new hooks
2. Implement optimistic updates for mutations
3. Add intelligent caching and invalidation
4. Create proper loading and error states
5. Optimize navigation to prevent page reloads

### Phase 5: Performance & Polish
1. Implement code splitting and lazy loading
2. Add proper SEO and meta tags
3. Optimize bundle size and runtime performance
4. Add offline support with service worker
5. Comprehensive testing and cleanup

## Security Considerations

### Token Management
- Store access tokens in memory when possible
- Use httpOnly cookies for refresh tokens in production
- Implement proper token expiration handling
- Clear tokens on logout

### API Security
- Validate all API responses
- Sanitize user inputs
- Implement proper CORS handling
- Use HTTPS in production

### Data Validation
- Client-side validation for user experience
- Rely on server-side validation for security
- Proper error message handling without exposing sensitive information
