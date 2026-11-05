import { apiBaseUrl } from '@/config/environment'
import type { User } from '@/types/User'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// Returns a user-facing reason the file cannot be used, or null when it is acceptable
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return 'Profile pictures must be PNG, JPEG, WebP or GIF images.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Profile pictures must be 2 MB or smaller.'
  }
  return null
}

export function getAvatarSrc(user: Pick<User, 'avatar_url'> | null | undefined): string | undefined {
  return user?.avatar_url ? `${apiBaseUrl}${user.avatar_url}` : undefined
}
