import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RecipeView from "@/components/recipes/view/RecipeView";
import { siteUrl } from "@/config/environment";
import { fetchRecipeAuthorForServer, fetchRecipeForServer } from "@/utils/recipeServer";
import {
  buildRecipeJsonLd,
  firstImageUrl,
  htmlToPlainText,
  serializeJsonLd,
  truncate,
} from "@/utils/recipeStructuredData";

// Must be a literal; keep in sync with RECIPE_REVALIDATE_SECONDS in utils/recipeServer
export const revalidate = 300;

// No recipes are prebuilt at deploy time; each is rendered on first request and
// then served from the ISR cache until `revalidate` expires.
export async function generateStaticParams() {
  return [];
}

interface RecipePageProps {
  params: Promise<{ recipe_id: string }>;
}

const recipeUrl = (id: string) => `${siteUrl}/recipes/view/${encodeURIComponent(id)}`;

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { recipe_id } = await params;
  const result = await fetchRecipeForServer(recipe_id);
  if (result.status !== "found") return {};

  const { recipe } = result;
  const description =
    truncate(htmlToPlainText(recipe.description), 160) ||
    `${recipe.title} — a recipe from Cody Richter Cooks`;
  const image = firstImageUrl(recipe.description);

  return {
    title: `${recipe.title} | Cody Richter Cooks`,
    description,
    alternates: { canonical: recipeUrl(recipe.id) },
    openGraph: {
      type: "article",
      title: recipe.title,
      description,
      url: recipeUrl(recipe.id),
      siteName: "Cody Richter Cooks",
      ...(image && { images: [image] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: recipe.title,
      description,
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { recipe_id } = await params;
  const [result, author] = await Promise.all([
    fetchRecipeForServer(recipe_id),
    fetchRecipeAuthorForServer(recipe_id),
  ]);

  if (result.status === "not_found") notFound();

  // Backend unavailable: render the client view, which fetches and shows errors itself
  if (result.status === "unavailable") {
    return <RecipeView recipeId={recipe_id} />;
  }

  const jsonLd = buildRecipeJsonLd(result.recipe, recipeUrl(result.recipe.id), author);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <RecipeView recipeId={recipe_id} initialRecipe={result.recipe} initialAuthorName={author} />
    </>
  );
}
