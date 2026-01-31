// User interface matching backend schema
export interface User {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

// User registration interface (UserCreate schema)
export interface UserCreate {
  username: string
  email: string
  password: string
}

// User update interface
export interface UserUpdate {
  username?: string
  email?: string
}

// Authentication token response interface
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// Login request interface
export interface LoginRequest {
  username: string
  password: string
}

// Token refresh request interface
export interface TokenRefreshRequest {
  refresh_token: string
}

// Token refresh response interface
export interface TokenRefreshResponse {
  access_token: string
  token_type: string
}

// Legacy interface for backward compatibility
export type UserRegistration = UserCreate;
