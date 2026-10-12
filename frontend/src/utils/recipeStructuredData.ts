import { RecipeDetail } from '@/types/Recipe'
import { convertToFractionalRepresentation } from '@/utils/recipeUtils'

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/** Plain text from sanitized rich-text HTML, for meta descriptions and JSON-LD. */
export function htmlToPlainText(html: string | undefined): string {
  if (!html) return ''
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

/** First hosted (http/https) image in the description; inline data: images can't be shared. */
export function firstImageUrl(html: string | undefined): string | undefined {
  if (!html) return undefined
  const match = html.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i)
  return match?.[1]
}

export function formatIngredientText(ingredient: RecipeDetail['ingredients'][number]): string {
  const quantity = convertToFractionalRepresentation(ingredient.quantity)
  const unit = ingredient.unit ? `${ingredient.unit} ` : ''
  const subtext = ingredient.subtext ? ` (${ingredient.subtext})` : ''
  return `${quantity} ${unit}${ingredient.name}${subtext}`
}

/** schema.org Recipe (https://developers.google.com/search/docs/appearance/structured-data/recipe) */
export function buildRecipeJsonLd(
  recipe: RecipeDetail,
  url: string,
  author: string | null
): Record<string, unknown> {
  const image = firstImageUrl(recipe.description)
  const description = truncate(htmlToPlainText(recipe.description), 500)

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    url,
    datePublished: recipe.created_at,
    dateModified: recipe.updated_at,
    ...(description && { description }),
    ...(image && { image: [image] }),
    ...(author && { author: { '@type': 'Person', name: author } }),
    ...(recipe.cooking_time && { totalTime: `PT${recipe.cooking_time}M` }),
    ...(recipe.serving_size && { recipeYield: `${recipe.serving_size}` }),
    ...(recipe.tags?.length && { keywords: recipe.tags.join(', ') }),
    recipeIngredient: [...recipe.ingredients]
      .sort((a, b) => a.order_index - b.order_index)
      .map(formatIngredientText),
    recipeInstructions: [...recipe.instructions]
      .sort((a, b) => a.step_number - b.step_number)
      .map((step) => ({
        '@type': 'HowToStep',
        name: step.title,
        text: htmlToPlainText(step.description) || step.title,
      })),
  }
}

/** Serializes JSON-LD for a <script> tag; escapes `<` so content can't close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
