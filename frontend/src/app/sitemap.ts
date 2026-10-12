import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/environment";
import { fetchAllRecipesForServer } from "@/utils/recipeServer";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await fetchAllRecipesForServer().catch(() => []);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...recipes.map((recipe) => ({
      url: `${siteUrl}/recipes/view/${encodeURIComponent(recipe.id)}`,
      lastModified: recipe.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
