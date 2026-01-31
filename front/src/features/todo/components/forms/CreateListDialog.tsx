import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface CreateListDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (title: string) => Promise<void>;
	initialTitle?: string;
	mode?: "create" | "edit";
}

export function CreateListDialog({
	isOpen,
	onOpenChange,
	onSubmit,
	initialTitle = "",
	mode = "create",
}: CreateListDialogProps) {
	const [title, setTitle] = useState(initialTitle);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setTitle(initialTitle);
		}
	}, [isOpen, initialTitle]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!title.trim() || isSubmitting) return;

		try {
			setIsSubmitting(true);
			await onSubmit(title);
			if (mode === "create") {
				setTitle("");
			}
			onOpenChange(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "リストを作成" : "リストを編集"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "新しいタスクリストの名前を入力してください。"
							: "タスクリストの名前を変更します。"}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">リスト名</Label>
						<Input
							id="title"
							placeholder="例: 買い物リスト、プロジェクトA..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.nativeEvent.isComposing) {
									e.preventDefault();
									handleSubmit();
								}
							}}
							autoFocus
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						キャンセル
					</Button>
					<Button
						onClick={() => handleSubmit()}
						disabled={!title.trim() || isSubmitting}
						className="bg-indigo-600 text-white hover:bg-indigo-700"
					>
						{mode === "create" ? "作成" : "保存"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
