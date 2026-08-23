import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import { Link } from "@mantine/tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextEditorImageExtension } from "@/components/recipes/edit/description/TextEditorTiptapExtension";
import Underline from "@tiptap/extension-underline";
import EditRecipeDescriptionTextEditor from "@/components/recipes/edit/description/EditRecipeDescriptionTextEditor";
import { useRef, useEffect } from "react";

interface TipTapEditorWrapperProps {
    description: string;
    setDescription: (description: string) => void;
}

// Memoized extensions array to prevent recreation on each render
const extensions = [
    Underline,
    Link,
    Superscript,
    SubScript,
    Highlight,
    StarterKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextEditorImageExtension,
    Placeholder.configure({
        placeholder: "Write a short story, overview, or serving tips for this recipe...",
        emptyEditorClass: "is-editor-empty",
    }),
];

// Debounce delay for syncing editor content to form state (ms)
const DEBOUNCE_DELAY = 300;

/**
 * TipTap editor wrapper that manages editor lifecycle.
 * Uses a ref for setDescription to avoid editor recreation when callback changes.
 * Debounces updates to prevent form re-renders on every keystroke.
 */
export default function TipTapEditorWrapper({
    description,
    setDescription,
}: TipTapEditorWrapperProps) {
    // Store callback in ref to avoid editor recreation
    const setDescriptionRef = useRef(setDescription);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setDescriptionRef.current = setDescription;
    }, [setDescription]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const editor = useEditor({
        extensions,
        immediatelyRender: false,
        content: description,
        onUpdate({ editor }) {
            // Debounce form updates to prevent re-renders on every keystroke
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                setDescriptionRef.current(editor.getHTML());
            }, DEBOUNCE_DELAY);
        },
    });

    if (!editor) return null;

    return <EditRecipeDescriptionTextEditor editor={editor} />;
}
