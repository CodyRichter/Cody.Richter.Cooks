import { cache } from 'react'
import { apiBaseUrl } from '@/config/environment'
import { RecipeDetail, RecipeListItem } from '@/types/Recipe'
import { RecipePermissionWithUser } from '@/types/Permission'
import { PaginatedResponse } from '@/types/api'

// How long server-rendered recipe pages may be served from cache (seconds)
export const RECIPE_REVALIDATE_SECONDS = 300

export type ServerRecipeResult =
  | { status: 'found'; recipe: RecipeDetail }
  | { status: 'not_found' }
  | { status: 'unavailable' }

/**
 * Fetches a recipe for server rendering. `cache` dedupes the call shared by
 * generateMetadata and the page. Backend outages resolve to 'unavailable' so the
 * page can fall back to client-side fetching instead of erroring.
 */
export const fetchRecipeForServer = cache(async (id: string): Promise<ServerRecipeResult> => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/recipes/${encodeURIComponent(id)}/`, {
      next: { revalidate: RECIPE_REVALIDATE_SECONDS },
    })
    if (response.status === 404) return { status: 'not_found' }
    if (!response.ok) return { status: 'unavailable' }
    return { status: 'found', recipe: await response.json() }
  } catch {
    return { status: 'unavailable' }
  }
})

export const fetchRecipeAuthorForServer = cache(async (id: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/recipes/${encodeURIComponent(id)}/permissions/`,
      { next: { revalidate: RECIPE_REVALIDATE_SECONDS } }
    )
    if (!response.ok) return null
    const permissions: RecipePermissionWithUser[] = await response.json()
    return permissions.find((p) => p.role === 'owner')?.user_username ?? null
  } catch {
    return null
  }
})

/**
 * One page of recipes, newest first, so lists render with data instead of
 * skeletons. Returns null when the backend is unavailable; the client then
 * fetches the list itself.
 */
export async function fetchRecipeListForServer(
  page: number,
  limit: number
): Promise<PaginatedResponse<RecipeListItem> | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/recipes/?page=${page}&limit=${limit}`, {
      next: { revalidate: RECIPE_REVALIDATE_SECONDS },
    })
    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}

/** All recipes, newest first, for the sitemap. Stops at `maxPages` as a safeguard. */
export async function fetchAllRecipesForServer(maxPages = 50): Promise<RecipeListItem[]> {
  const recipes: RecipeListItem[] = []
  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(`${apiBaseUrl}/api/v1/recipes/?page=${page}&limit=20`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) break
    const data: { items: RecipeListItem[]; has_next: boolean } = await response.json()
    recipes.push(...data.items)
    if (!data.has_next) break
  }
  return recipes
}
