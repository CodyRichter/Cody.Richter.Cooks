import { Avatar, type AvatarProps } from '@mantine/core'

import { resolveAvatarUrl } from '@/utils/avatar'

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name' | 'alt' | 'color'> {
  // Path relative to the API, as returned by the backend
  avatarUrl?: string | null
  username?: string | null
}

// A user's profile picture, or their initials on a name-derived color when they have none
export function UserAvatar({ avatarUrl, username, size = 'md', radius = 'xl', className, ...props }: UserAvatarProps) {
  return (
    <Avatar
      {...props}
      className={className ? `user-avatar ${className}` : 'user-avatar'}
      src={resolveAvatarUrl(avatarUrl)}
      name={username ?? undefined}
      color="initials"
      size={size}
      radius={radius}
      alt={username ? `${username}'s profile picture` : 'Profile picture'}
    />
  )
}
