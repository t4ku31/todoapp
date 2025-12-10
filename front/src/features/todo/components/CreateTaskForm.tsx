import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CreateTaskFormProps {
    taskListId: number;
    onCreateTask: (taskListId: number, title: string) => Promise<void>;
}

export function CreateTaskForm({ taskListId, onCreateTask }: CreateTaskFormProps) {
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onCreateTask(taskListId, title);
            setTitle("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="新しいタスクを追加..."
                className="flex-1"
                disabled={isSubmitting}
            />
            <Button type="submit" size="icon" disabled={isSubmitting || !title.trim()}>
                <Plus className="h-4 w-4" />
            </Button>
        </form>
    );
}
