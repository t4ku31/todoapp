import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableTitleProps {
    id: number;
    title: string;
    onTitleChange: (id: number, newTitle: string) => Promise<void>;
}

export function EditableTitle({ id, title, onTitleChange }: EditableTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const [isHovered, setIsHovered] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editedTitle.trim() === "") {
            // Don't allow empty titles
            setEditedTitle(title);
            setIsEditing(false);
            return;
        }

        if (editedTitle === title) {
            // No change
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onTitleChange(id, editedTitle);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save title:", error);
            // Revert on error
            setEditedTitle(title);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedTitle(title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                {isSaving && (
                    <span className="text-xs text-gray-500">保存中...</span>
                )}
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-2 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsEditing(true)}
        >
            <p className="font-medium">{title}</p>
            <Pencil
                className={`w-4 h-4 text-gray-400 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"
                    }`}
            />
        </div>
    );
}
