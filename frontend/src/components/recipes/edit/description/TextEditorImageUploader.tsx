import {
  Alert,
  Button,
  FileInput,
  Image as MantineImage,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconPhoto } from "@tabler/icons-react";
import React, { useCallback, useEffect, useState } from "react";

import { Editor } from "@tiptap/react";
import imageCompression from "browser-image-compression";

interface TextEditorImageUploaderProps {
  editor: Editor;
}

const MAX_SIZE_BYTES = 1024 * 1024; // 1MB
const MAX_WIDTH_HEIGHT = 1200; // Max 1200px width or height

export default function TextEditorImageUploader({
  editor,
}: TextEditorImageUploaderProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setCompressionInfo(null);
    setIsProcessing(false);
    setCompressedBase64(null);
  }, []);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    const compressionLevels = [
      { maxSizeMB: 1.0, label: "WEBP" },
      { maxSizeMB: 1.0, label: "Compressed WEBP" },
      { maxSizeMB: 0.8, label: "Highly Compressed WEBP" },
    ];

    for (const level of compressionLevels) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: level.maxSizeMB,
          maxWidthOrHeight: MAX_WIDTH_HEIGHT,
          useWebWorker: true,
          fileType: "image/webp",
        });

        if (compressedFile.size <= MAX_SIZE_BYTES) {
          const compressionRatio = (
            (1 - compressedFile.size / file.size) *
            100
          ).toFixed(1);
          setCompressionInfo(
            `${level.label}: ${(compressedFile.size / 1024).toFixed(
              1
            )}KB (${compressionRatio}% smaller)`
          );
          return compressedFile;
        }
      } catch (error) {
        console.error(`Compression level ${level.label} failed:`, error);
      }
    }

    throw new Error(
      "Failed to compress image to acceptable size. Please try a smaller image."
    );
  }, []);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const compressAndEncodeImage = useCallback(
    async (file: File): Promise<string> => {
      try {
        const compressedFile = await compressImage(file);
        return await fileToBase64(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
        throw new Error("Failed to process image. Please try again.");
      }
    },
    [compressImage, fileToBase64]
  );

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) {
        resetState();
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }

      setError(null);
      setSelectedFile(file);
      setIsProcessing(true);

      try {
        const base64Data = await compressAndEncodeImage(file);
        setCompressedBase64(base64Data);
        setPreviewUrl(base64Data);
      } catch (error) {
        console.error("Image processing failed:", error);
        setError(
          error instanceof Error ? error.message : "Failed to process image"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [resetState, compressAndEncodeImage]
  );

  const handleClose = useCallback(() => {
    resetState();
    setModalOpened(false);
  }, [resetState]);

  const handleInsert = useCallback(() => {
    if (!compressedBase64 || !selectedFile) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: compressedBase64,
        alt: selectedFile.name,
      })
      .run();

    handleClose();
  }, [compressedBase64, selectedFile, editor, handleClose]);

  return (
    <>
      <Button
        variant="subtle"
        size="sm"
        onClick={() => setModalOpened(true)}
        aria-label="Insert image"
        color="#485057"
        pl={8}
        pr={8}
        className="tiptap-editor-button"
      >
        <IconPhoto size={17} />
      </Button>

      <Modal
        opened={modalOpened}
        onClose={handleClose}
        title="Insert Image"
        size="md"
        centered
      >
        <Stack gap="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

          <FileInput
            label="Select Image"
            placeholder="Choose an image file"
            accept="image/*"
            value={selectedFile}
            onChange={handleFileSelect}
            leftSection={<IconPhoto size={16} />}
            disabled={isProcessing}
          />

          {isProcessing && (
            <Text size="sm" c="dimmed">
              Processing image...
            </Text>
          )}

          {previewUrl && !isProcessing && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Preview:
              </Text>
              <MantineImage
                src={previewUrl}
                alt="Preview"
                style={{ maxHeight: 200, objectFit: "contain" }}
              />
            </Stack>
          )}

          {compressionInfo && (
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                {compressionInfo} (max 1MB, 1200px width/height)
              </Text>
            </Stack>
          )}

          <Stack gap="sm">
            <Button
              onClick={handleInsert}
              disabled={!compressedBase64 || isProcessing}
              fullWidth
            >
              Insert Image
            </Button>
            <Button variant="outline" onClick={handleClose} fullWidth>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
