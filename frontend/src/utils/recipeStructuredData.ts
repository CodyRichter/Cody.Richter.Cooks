import { FilterXSS } from 'xss'

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

const BLOCK_BOUNDARY_TAGS = new Set(['br', 'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

// Parser-based stripping: a single regex pass can leave tags behind (e.g. `<<b>script>`)
const textOnlyFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTagBody: ['script', 'style'],
  onIgnoreTag: (tag) => (BLOCK_BOUNDARY_TAGS.has(tag.toLowerCase()) ? ' ' : ''),
})

/** Plain text from rich-text HTML, for meta descriptions and JSON-LD. */
export function htmlToPlainText(html: string | undefined): string {
  if (!html) return ''
  return textOnlyFilter
    .process(html)
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
