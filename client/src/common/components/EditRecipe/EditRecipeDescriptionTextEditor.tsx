import { Editor } from "@tiptap/react";
import { RichTextEditor } from "@mantine/tiptap";
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
        toolbar: {
          padding: isMobile ? "12px 8px" : "8px",
          gap: isMobile ? "8px" : "4px",
        },
        control: {
          width: isMobile ? "44px" : "32px",
          height: isMobile ? "44px" : "32px",
          fontSize: isMobile ? "18px" : "14px",
        },
        content: {
          fontSize: isMobile ? "16px" : "14px",
          lineHeight: isMobile ? "1.6" : "1.5",
          padding: isMobile ? "16px" : "12px",
        },
      }}
    >
      <RichTextEditor.Toolbar
        sticky
        stickyOffset={isMobile ? 80 : 60}
        style={{
          flexWrap: "wrap",
          gap: isMobile ? "3px" : "2px",
          justifyContent: isMobile ? "center" : "flex-start",
        }}
      >
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Blockquote />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
