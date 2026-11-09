import { ActionIcon, Box, Button, Group, Modal, Slider, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

import { cropAvatar } from "@/utils/avatar";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

interface AvatarCropModalProps {
  // Object URL of the picked photo; null while nothing is being cropped
  imageSrc: string | null;
  opened: boolean;
  uploading: boolean;
  onCancel: () => void;
  onSave: (file: File) => void;
  onExited: () => void;
}

interface CropEditorProps {
  imageSrc: string;
  uploading: boolean;
  onCancel: () => void;
  onSave: (file: File) => void;
}

function CropEditor({ imageSrc, uploading, onCancel, onSave }: CropEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSave() {
    if (!cropPixels) return;
    setIsProcessing(true);
    try {
      onSave(await cropAvatar(imageSrc, cropPixels));
    } catch (error) {
      notifications.show({
        title: "Could not process that image",
        message: error instanceof Error ? error.message : "Try a different photo.",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Stack gap="md">
      <Box
        className="avatar-cropper"
        pos="relative"
        h={{ base: 280, sm: 340 }}
        bg="dark.8"
        style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setCropPixels(pixels)}
          cropperProps={{ "aria-label": "Picture position. Drag, or use the arrow keys, to move it." }}
        />
      </Box>

      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP * 5))}
        >
          <IconZoomOut size={18} />
        </ActionIcon>
        <Slider
          flex={1}
          value={zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          onChange={setZoom}
          label={(value) => `${value.toFixed(1)}×`}
          thumbLabel="Zoom"
        />
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP * 5))}
        >
          <IconZoomIn size={18} />
        </ActionIcon>
      </Group>

      <Text size="xs" c="dimmed">
        Drag to reposition and zoom to frame your face. Saved as a 512 × 512 picture.
      </Text>

      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button
          leftSection={<IconCheck size={16} />}
          loading={isProcessing || uploading}
          disabled={!cropPixels}
          onClick={handleSave}
          data-autofocus
        >
          Save Picture
        </Button>
      </Group>
    </Stack>
  );
}

export default function AvatarCropModal({
  imageSrc,
  opened,
  uploading,
  onCancel,
  onSave,
  onExited,
}: AvatarCropModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      onExitTransitionEnd={onExited}
      title="Crop profile picture"
      centered
      closeOnClickOutside={!uploading}
      closeOnEscape={!uploading}
      withCloseButton={!uploading}
    >
      {imageSrc && (
        <CropEditor
          key={imageSrc}
          imageSrc={imageSrc}
          uploading={uploading}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}
