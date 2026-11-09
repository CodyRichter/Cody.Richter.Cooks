import { apiBaseUrl } from '@/config/environment'

// Server-side upload limit; cropped avatars are re-encoded far below it
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
// Photos are only decoded in the browser, so a generous cap just guards memory
export const AVATAR_SOURCE_MAX_BYTES = 40 * 1024 * 1024
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const AVATAR_OUTPUT_SIZE = 512

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

// Returns a user-facing reason the file cannot be used, or null when it is acceptable
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return 'Profile pictures must be PNG, JPEG, WebP or GIF images.'
  }
  if (file.size > AVATAR_SOURCE_MAX_BYTES) {
    return 'That photo is too large to process. Try one under 40 MB.'
  }
  return null
}

// avatar_url is relative to the API, or null when no picture is set
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  return avatarUrl ? `${apiBaseUrl}${avatarUrl}` : undefined
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The image could not be read.'))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
      type,
      quality
    )
  })
}

const ENCODE_QUALITIES = [0.9, 0.8, 0.65, 0.5]

/**
 * Crops `area` (in source pixels, as reported by react-easy-crop) out of the
 * image at `imageSrc` and returns it as a square WebP, stepping quality down
 * until it fits the upload limit. Browsers that cannot encode WebP (Safari)
 * produce PNG instead, which the server also accepts.
 */
export async function cropAvatar(
  imageSrc: string,
  area: CropArea,
  size = AVATAR_OUTPUT_SIZE
): Promise<File> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image processing is not supported in this browser.')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size)

  for (const quality of ENCODE_QUALITIES) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality)
    // Browsers without a WebP encoder hand back PNG, which at this size always fits
    if (blob.type !== 'image/webp') {
      return new File([blob], 'avatar.png', { type: blob.type })
    }
    if (blob.size <= AVATAR_MAX_BYTES) {
      return new File([blob], 'avatar.webp', { type: 'image/webp' })
    }
  }
  throw new Error('The image could not be compressed enough.')
}
