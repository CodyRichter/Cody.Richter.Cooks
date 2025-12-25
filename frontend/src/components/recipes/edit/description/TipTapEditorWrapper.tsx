import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import { Link } from "@mantine/tiptap";
import StarterKit from "@tiptap/starter-kit";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextEditorImageExtension } from "./TextEditorTiptapExtension";
import Underline from "@tiptap/extension-underline";
import EditRecipeDescriptionTextEditor from "./EditRecipeDescriptionTextEditor";

interface TipTapEditorWrapperProps {
    description: string;
    setDescription: (description: string) => void;
}

const TipTapEditorWrapper: React.FC<TipTapEditorWrapperProps> = ({
    description,
    setDescription,
}) => {
    const editor = useEditor({
        extensions: [
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            StarterKit,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            TextEditorImageExtension,
        ],
        immediatelyRender: false,
        content: description,
        onUpdate({ editor }) {
            setDescription(editor.getHTML());
        },
    });

    return editor ? <EditRecipeDescriptionTextEditor editor={editor} /> : null;
};

export default TipTapEditorWrapper;
