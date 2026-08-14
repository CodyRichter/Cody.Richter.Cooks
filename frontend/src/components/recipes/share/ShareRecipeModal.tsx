import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Divider,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core'
import { IconTrash, IconUserPlus, IconInfoCircle, IconUser } from '@tabler/icons-react'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipePermissions } from '@/hooks/useRecipePermissions'
import {
    useGrantRecipePermission,
    useRevokeRecipePermission,
} from '@/hooks/useRecipePermissionMutations'

interface ShareRecipeModalProps {
    recipeId: string
    isOwner: boolean
    opened: boolean
    close: () => void
}

export default function ShareRecipeModal({
    recipeId,
    isOwner,
    opened,
    close,
}: ShareRecipeModalProps) {
    const isMobile = useMediaQuery('(max-width: 768px)', false, {
        getInitialValueInEffect: true,
    })
    const auth = useAuth()

    const [usernameInput, setUsernameInput] = useState('')

    const { data: permissions, isLoading } = useRecipePermissions(recipeId)
    const grantPermission = useGrantRecipePermission(recipeId)
    const revokePermission = useRevokeRecipePermission(recipeId)

    const handleAddCollaborator = async () => {
        if (!usernameInput.trim()) return

        try {
            await grantPermission.mutateAsync(usernameInput.trim())
            setUsernameInput('')
        } catch {
            // Error is already handled by mutation's onError callback
        }
    }

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            await revokePermission.mutateAsync(userId)
        } catch {
            // Error is already handled by mutation's onError callback
        }
    }

    const handleClose = () => {
        setUsernameInput('')
        grantPermission.reset()
        revokePermission.reset()
        close()
    }

    const sortedPermissions = permissions
        ? [...permissions].sort((a, b) => {
            // Owner first
            if (a.role === 'owner' && b.role !== 'owner') return -1
            if (a.role !== 'owner' && b.role === 'owner') return 1
            // Then alphabetical by username
            return a.user_username.localeCompare(b.user_username)
        })
        : []

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={isOwner ? 'Share Recipe' : 'Recipe Collaborators'}
            centered
            size="lg"
            fullScreen={isMobile}
        >
            <Stack gap="md">
                {/* Add Collaborator Section - Only for Owners */}
                {isOwner && (
                    <>
                        <Box>
                            <Text size="sm" fw={600} mb="xs">
                                Add Collaborator
                            </Text>
                            <Group gap="xs" align="flex-end">
                                <TextInput
                                    placeholder="Enter username..."
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && usernameInput.trim()) {
                                            handleAddCollaborator()
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                    disabled={grantPermission.isPending}
                                    autoComplete="new-password"
                                    data-1p-ignore
                                    data-lpignore="true"
                                    data-form-type="other"
                                />
                                <Button
                                    leftSection={<IconUserPlus size="1rem" />}
                                    onClick={handleAddCollaborator}
                                    disabled={!usernameInput.trim() || grantPermission.isPending}
                                    loading={grantPermission.isPending}
                                    color="teal"
                                >
                                    Add
                                </Button>
                            </Group>
                        </Box>

                        <Divider />
                    </>
                )}

                {/* Collaborators List */}
                <Box>
                    <Text size="sm" fw={600} mb="xs">
                        Collaborators
                    </Text>

                    {isLoading ? (
                        <Text size="sm" c="dimmed">
                            Loading...
                        </Text>
                    ) : sortedPermissions.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            No collaborators
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            {sortedPermissions.map((permission) => {
                                const isCurrentUser = permission.user_username === auth.user?.username
                                const isOwnerRole = permission.role === 'owner'

                                return (
                                    <Group
                                        key={permission.id}
                                        justify="space-between"
                                        p="sm"
                                        style={{
                                            borderRadius: 'var(--mantine-radius-md)',
                                            border: '1px solid var(--mantine-color-default-border)',
                                            backgroundColor: isCurrentUser
                                                ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                                : 'transparent',
                                        }}
                                    >
                                        <Group gap="sm">
                                            <IconUser size="1.2rem" stroke={1.5} />
                                            <Box>
                                                <Text size="sm" fw={500}>
                                                    {permission.user_username}
                                                    {isCurrentUser && (
                                                        <Text component="span" size="xs" c="dimmed" ml="xs">
                                                            (you)
                                                        </Text>
                                                    )}
                                                </Text>
                                            </Box>
                                        </Group>

                                        <Group gap="xs">
                                            <Badge
                                                variant={isOwnerRole ? 'filled' : 'outline'}
                                                color={isOwnerRole ? 'orange' : 'blue'}
                                                size="sm"
                                            >
                                                {permission.role === 'owner' ? 'Owner' : 'Editor'}
                                            </Badge>

                                            {/* Remove button - only for owners, not on self, not on owner */}
                                            {isOwner && !isOwnerRole && (
                                                <Tooltip label="Remove collaborator">
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        onClick={() => handleRemoveCollaborator(permission.user_id)}
                                                        loading={revokePermission.isPending}
                                                        disabled={revokePermission.isPending}
                                                    >
                                                        <IconTrash size="1rem" stroke={1.5} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </Group>
                                    </Group>
                                )
                            })}
                        </Stack>
                    )}
                </Box>

                {/* Info message for editors */}
                {!isOwner && (
                    <>
                        <Divider />
                        <Group gap="xs" c="dimmed">
                            <IconInfoCircle size="1rem" />
                            <Text size="xs">Only the recipe owner can add or remove editors.</Text>
                        </Group>
                    </>
                )}

                {/* Close Button */}
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={handleClose}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
