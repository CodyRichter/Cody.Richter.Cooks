import { Editor } from "@tiptap/react";
import { RichTextEditor } from "@mantine/tiptap";
import TextEditorImageUploader from "@/components/recipes/edit/description/TextEditorImageUploader";
import { useMediaQuery } from "@mantine/hooks";

export default function EditRecipeDescriptionTextEditor({
  editor,
}: {
  editor: Editor;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        root: {
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
        },
        toolbar: {
          padding: isMobile ? "6px" : "4px 6px",
          gap: "4px",
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          alignItems: 'center',
        },
        controlsGroup: {
          display: 'inline-flex',
          alignItems: 'center',
        },
        control: {
          width: isMobile ? "32px" : "28px",
          height: isMobile ? "32px" : "28px",
          minWidth: isMobile ? "32px" : "28px",
          minHeight: isMobile ? "32px" : "28px",
          fontSize: isMobile ? "14px" : "13px",
          borderRadius: 'var(--mantine-radius-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          fontSize: isMobile ? "15px" : "14px",
          lineHeight: "1.6",
          padding: isMobile ? "12px" : "14px",
          minHeight: "90px",
        },
      }}
      variant="subtle"
    >
      <RichTextEditor.Toolbar
        style={{
          flexWrap: "wrap",
          gap: "4px",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H3 />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Blockquote />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
          <TextEditorImageUploader editor={editor} />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
