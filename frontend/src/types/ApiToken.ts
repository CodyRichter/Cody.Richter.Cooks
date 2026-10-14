/**
 * Personal API token types matching backend app/schemas/api_token.py
 */

export type ApiTokenScope = 'recipes:read' | 'recipes:write'

export interface ApiToken {
  id: string
  name: string
  token_prefix: string
  scopes: ApiTokenScope[]
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export interface ApiTokenCreate {
  name: string
  scopes: ApiTokenScope[]
  expires_in_days: number | null
}

// Returned once at creation; `token` cannot be retrieved again
export interface ApiTokenCreated extends ApiToken {
  token: string
}
