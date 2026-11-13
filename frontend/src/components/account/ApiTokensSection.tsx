import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  Radio,
  Select,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconCopy, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { SettingRow, SettingsSection } from "@/components/account/Settings";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { apiBaseUrl } from "@/config/environment";
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from "@/hooks/useApiTokens";
import { ApiToken, ApiTokenCreated, ApiTokenScope } from "@/types/ApiToken";

const mcpUrl = `${apiBaseUrl}/mcp`;

type Access = "edit" | "read";

const expiryOptions = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "never", label: "Never" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function inactiveReason(token: ApiToken): "Revoked" | "Expired" | null {
  if (token.revoked_at) return "Revoked";
  if (token.expires_at && new Date(token.expires_at) <= new Date()) return "Expired";
  return null;
}

function tokenSummary(token: ApiToken) {
  const access = token.scopes.includes("recipes:write") ? "View and edit" : "View only";
  const lastUsed = token.last_used_at ? `Last used ${formatDate(token.last_used_at)}` : "Never used";
  const expiry = token.revoked_at
    ? `Revoked ${formatDate(token.revoked_at)}`
    : token.expires_at
      ? `${inactiveReason(token) ? "Expired" : "Expires"} ${formatDate(token.expires_at)}`
      : "No expiry";
  return [access, lastUsed, expiry].join(" · ");
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
            <ActionIcon
              variant="subtle"
              color={copied ? "teal" : "gray"}
              aria-label="Copy"
              onClick={copy}
            >
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
      <Alert color="yellow">Copy this token now. You won&apos;t see it again.</Alert>
      <CopyableCode value={created.token} />
      <Tabs defaultValue="claude">
        <Tabs.List>
          <Tabs.Tab value="claude">Claude Code</Tabs.Tab>
          <Tabs.Tab value="gemini">Gemini CLI</Tabs.Tab>
          <Tabs.Tab value="other">Other</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="claude" pt="sm">
          <Text size="sm" mb="xs">Run in a terminal:</Text>
          <CopyableCode value={claudeCommand} />
        </Tabs.Panel>
        <Tabs.Panel value="gemini" pt="sm">
          <Text size="sm" mb="xs">Add to <Code>~/.gemini/settings.json</Code>:</Text>
          <CopyableCode value={geminiConfig} />
        </Tabs.Panel>
        <Tabs.Panel value="other" pt="sm">
          <Text size="sm" mb="xs">MCP server URL (Streamable HTTP):</Text>
          <CopyableCode value={mcpUrl} />
          <Text size="sm" mt="sm" mb="xs">Send the token as a header:</Text>
          <CopyableCode value={`Authorization: Bearer ${created.token}`} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function CreateTokenModal({ opened, close }: { opened: boolean; close: () => void }) {
  const [name, setName] = useState("");
  const [access, setAccess] = useState<Access>("edit");
  const [expiry, setExpiry] = useState<string | null>("90");
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);
  const createToken = useCreateApiToken();

  function resetAndClose() {
    setName("");
    setAccess("edit");
    setExpiry("90");
    setCreated(null);
    createToken.reset();
    close();
  }

  function handleCreate() {
    const scopes: ApiTokenScope[] =
      access === "edit" ? ["recipes:read", "recipes:write"] : ["recipes:read"];
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
      title={created ? "Token created" : "New token"}
      size="lg"
      centered
    >
      {created ? (
        <Stack>
          <NewTokenDetails created={created} />
          <Group justify="flex-end">
            <Button onClick={resetAndClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) handleCreate();
          }}
        >
          <Stack>
            <TextInput
              label="Name"
              placeholder="e.g. Claude Code on laptop"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              maxLength={100}
              data-autofocus
            />
            <Radio.Group
              label="Access"
              value={access}
              onChange={(value) => setAccess(value as Access)}
            >
              <Stack gap="xs" mt={6}>
                <Radio value="edit" label="View and edit recipes" />
                <Radio value="read" label="View recipes" />
              </Stack>
            </Radio.Group>
            <Select
              label="Expires after"
              data={expiryOptions}
              value={expiry}
              onChange={setExpiry}
              allowDeselect={false}
            />
            <Group justify="flex-end" gap="xs" mt="xs">
              <Button variant="default" onClick={resetAndClose}>Cancel</Button>
              <Button type="submit" loading={createToken.isPending} disabled={!name.trim()}>
                Create token
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

export default function ApiTokensSection() {
  const [isCreateOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);
  const { data: tokens, isLoading } = useApiTokens();
  const revokeToken = useRevokeApiToken();

  return (
    <SettingsSection
      title="AI assistant access"
      description="Connect AI assistants like Claude Code to your recipes."
      action={
        <Button
          variant="default"
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
          style={{ flexShrink: 0 }}
        >
          New token
        </Button>
      }
    >
      {isLoading ? (
        <Box className="settings-row">
          <Skeleton h={18} w={160} radius="sm" />
          <Skeleton h={14} w={280} radius="sm" mt={6} />
        </Box>
      ) : tokens && tokens.length > 0 ? (
        tokens.map((token) => {
          const inactive = inactiveReason(token);
          return (
            <SettingRow
              key={token.id}
              label={
                <Group gap="xs" component="span">
                  {token.name}
                  {inactive && (
                    <Badge color="gray" variant="light" size="sm">
                      {inactive}
                    </Badge>
                  )}
                </Group>
              }
              value={
                <>
                  <Code>{token.token_prefix}…</Code> {tokenSummary(token)}
                </>
              }
              action={
                !inactive && (
                  <Button
                    variant="default"
                    aria-label={`Revoke ${token.name}`}
                    onClick={() => setTokenToRevoke(token)}
                  >
                    Revoke
                  </Button>
                )
              }
            />
          );
        })
      ) : (
        <Text className="settings-row" size="sm" c="dimmed">
          No tokens yet.
        </Text>
      )}

      <CreateTokenModal opened={isCreateOpen} close={closeCreate} />

      <ConfirmModal
        opened={tokenToRevoke !== null}
        title="Revoke token?"
        confirmLabel="Revoke"
        loading={revokeToken.isPending}
        onClose={() => setTokenToRevoke(null)}
        onConfirm={() =>
          tokenToRevoke &&
          revokeToken.mutate(tokenToRevoke.id, { onSuccess: () => setTokenToRevoke(null) })
        }
      >
        <strong>{tokenToRevoke?.name}</strong> will stop working immediately.
      </ConfirmModal>
    </SettingsSection>
  );
}
