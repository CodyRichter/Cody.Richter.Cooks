import { Group, PasswordInput, Popover, Progress, Text, rem } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
  return (
    <Text component="div" c={meets ? 'teal' : 'red'} mt={5} size="xs">
      <Group gap={5}>
        {meets ? <IconCheck style={{ width: rem(14), height: rem(14) }} /> : <IconX style={{ width: rem(14), height: rem(14) }} />}
        <span>{label}</span>
      </Group>
    </Text>
  );
}

const requirements = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

export function getPasswordStrength(password: string) {
  let strength = 0;
  if (password.length >= 8) {
    strength += 1;
  }

  requirements.forEach((requirement) => {
    if (requirement.re.test(password)) {
      strength += 1;
    }
  });

  return strength;
}

interface PasswordStrengthProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  name?: string;
  autoComplete?: string;
  mb?: string | number;
}

export function PasswordStrength({ value, onChange, label = "Password", placeholder = "Enter password", error, name, autoComplete, mb }: PasswordStrengthProps) {
  const [opened, setOpened] = useState(false);
  const strength = getPasswordStrength(value);
  const color = strength === 5 ? 'teal' : strength > 2 ? 'yellow' : 'red';

  return (
    <Popover
      opened={opened && strength < 5}
      position="bottom"
      width="target"
      transitionProps={{ transition: 'pop' }}
    >
      <Popover.Target>
        <div onFocusCapture={() => setOpened(true)} onBlurCapture={() => setOpened(false)}>
          <PasswordInput
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            placeholder={placeholder}
            label={label}
            error={error}
            name={name}
            autoComplete={autoComplete}
            mb={mb}
            required
          />
        </div>
      </Popover.Target>
      <Popover.Dropdown>
        <Progress color={color} value={strength * 20} size={5} mb="xs" />
        <PasswordRequirement meets={value.length >= 8} label="At least 8 characters" />
        {requirements.map((requirement, index) => (
          <PasswordRequirement key={index} meets={requirement.re.test(value)} label={requirement.label} />
        ))}
      </Popover.Dropdown>
    </Popover>
  );
}
