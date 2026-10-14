import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  CopyButton,
  Group,
  Modal,
  Select,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconCopy, IconKey, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { apiBaseUrl } from "@/config/environment";
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from "@/hooks/useApiTokens";
import { ApiToken, ApiTokenCreated, ApiTokenScope } from "@/types/ApiToken";

const mcpUrl = `${apiBaseUrl}/mcp`;

const expiryOptions = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "never", label: "Never" },
];

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Never";
}

function tokenStatus(token: ApiToken) {
  if (token.revoked_at) return <Badge color="gray" variant="light">Revoked</Badge>;
  if (token.expires_at && new Date(token.expires_at) <= new Date()) {
    return <Badge color="orange" variant="light">Expired</Badge>;
  }
  return <Badge color="green" variant="light">Active</Badge>;
}

function CopyableCode({ value }: { value: string }) {
  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <Code block style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {value}
      </Code>
      <CopyButton value={value}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
            <ActionIcon variant="subtle" color={copied ? "teal" : "gray"} onClick={copy}>
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

function NewTokenDetails({ created }: { created: ApiTokenCreated }) {
  const claudeCommand = `claude mcp add --transport http cooking ${mcpUrl} --header "Authorization: Bearer ${created.token}"`;
  const geminiConfig = JSON.stringify(
    {
      mcpServers: {
        cooking: { httpUrl: mcpUrl, headers: { Authorization: `Bearer ${created.token}` } },
      },
    },
    null,
    2
  );

  return (
    <Stack>
      <Alert color="yellow" title="Copy this token now">
        It will not be shown again. Anyone with it can use the access you granted.
      </Alert>
      <CopyableCode value={created.token} />
      <Tabs defaultValue="claude">
        <Tabs.List>
          <Tabs.Tab value="claude">Claude Code</Tabs.Tab>
          <Tabs.Tab value="gemini">Gemini CLI</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="claude" pt="sm">
          <Text size="sm" mb="xs">Run in a terminal:</Text>
          <CopyableCode value={claudeCommand} />
        </Tabs.Panel>
        <Tabs.Panel value="gemini" pt="sm">
          <Text size="sm" mb="xs">Add to <Code>~/.gemini/settings.json</Code>:</Text>
          <CopyableCode value={geminiConfig} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function CreateTokenModal({ opened, close }: { opened: boolean; close: () => void }) {
  const [name, setName] = useState("");
  const [allowWrite, setAllowWrite] = useState(true);
  const [expiry, setExpiry] = useState<string | null>("90");
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);
  const createToken = useCreateApiToken();

  function resetAndClose() {
    setName("");
    setAllowWrite(true);
    setExpiry("90");
    setCreated(null);
    createToken.reset();
    close();
  }

  function handleCreate() {
    const scopes: ApiTokenScope[] = allowWrite
      ? ["recipes:read", "recipes:write"]
      : ["recipes:read"];
    createToken.mutate(
      {
        name: name.trim(),
        scopes,
        expires_in_days: expiry && expiry !== "never" ? Number(expiry) : null,
      },
      { onSuccess: setCreated }
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={created ? "Token Created" : "Create AI Access Token"}
      size="lg"
    >
      {created ? (
        <Stack>
          <NewTokenDetails created={created} />
          <Group justify="flex-end">
            <Button onClick={resetAndClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Claude Code on laptop"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            maxLength={100}
            data-autofocus
          />
          <Checkbox
            label="Allow creating and editing recipes"
            description="Without this, the token can only search and read recipes."
            checked={allowWrite}
            onChange={(event) => setAllowWrite(event.currentTarget.checked)}
          />
          <Select
            label="Expires after"
            data={expiryOptions}
            value={expiry}
            onChange={setExpiry}
            allowDeselect={false}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={resetAndClose}>Cancel</Button>
            <Button
              onClick={handleCreate}
              loading={createToken.isPending}
              disabled={!name.trim()}
            >
              Create Token
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

export default function ApiTokensSection() {
  const [isCreateOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const { data: tokens, isLoading } = useApiTokens();
  const revokeToken = useRevokeApiToken();

  return (
    <Card shadow="sm" radius="md" withBorder pb="lg" mt="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconKey size={20} />
          <Title order={4}>AI Assistant Access</Title>
        </Group>
        <Button size="compact-sm" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Create Token
        </Button>
      </Group>
      <Text mt="md" size="sm" c="dimmed">
        Tokens let AI assistants such as Claude Code or Gemini CLI add and edit your
        recipes through the MCP server at <Code>{mcpUrl}</Code>. They cannot delete
        recipes, change sharing, or access your account.
      </Text>

      {isLoading ? (
        <Skeleton height={80} mt="md" />
      ) : tokens && tokens.length > 0 ? (
        <Table.ScrollContainer minWidth={560} mt="md">
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Token</Table.Th>
                <Table.Th>Access</Table.Th>
                <Table.Th>Last Used</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tokens.map((token) => (
                <Table.Tr key={token.id}>
                  <Table.Td>{token.name}</Table.Td>
                  <Table.Td><Code>{token.token_prefix}…</Code></Table.Td>
                  <Table.Td>
                    {token.scopes.includes("recipes:write") ? "Read & write" : "Read only"}
                  </Table.Td>
                  <Table.Td>{formatDate(token.last_used_at)}</Table.Td>
                  <Table.Td>{formatDate(token.expires_at)}</Table.Td>
                  <Table.Td>{tokenStatus(token)}</Table.Td>
                  <Table.Td>
                    {!token.revoked_at && (
                      <Tooltip label="Revoke" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label={`Revoke ${token.name}`}
                          loading={revokeToken.isPending && revokeToken.variables === token.id}
                          onClick={() => revokeToken.mutate(token.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text mt="md" size="sm">No tokens yet.</Text>
      )}

      <CreateTokenModal opened={isCreateOpen} close={closeCreate} />
    </Card>
  );
}
