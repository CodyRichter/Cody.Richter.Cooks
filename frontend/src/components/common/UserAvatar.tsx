import { Avatar, type AvatarProps } from '@mantine/core'

import { resolveAvatarUrl } from '@/utils/avatar'

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name' | 'alt' | 'color'> {
  // Path relative to the API, as returned by the backend
  avatarUrl?: string | null
  username?: string | null
  // Set when a surrounding control already names the picture, e.g. a labelled button
  decorative?: boolean
}

// A user's profile picture, or their initials on a name-derived color when they have none
export function UserAvatar({
  avatarUrl,
  username,
  decorative = false,
  size = 'md',
  radius = '50%',
  className,
  ...props
}: UserAvatarProps) {
  return (
    <Avatar
      {...props}
      className={className ? `user-avatar ${className}` : 'user-avatar'}
      src={resolveAvatarUrl(avatarUrl)}
      name={username ?? undefined}
      color="initials"
      size={size}
      radius={radius}
      alt={decorative ? '' : username ? `${username}'s profile picture` : 'Profile picture'}
    />
  )
}
