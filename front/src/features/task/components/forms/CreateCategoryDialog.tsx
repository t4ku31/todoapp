import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

// 12 preset colors (Vivid / Tailwind 500s)
const COLOR_PALETTE = [
	"#ef4444", // Red
	"#f97316", // Orange
	"#f59e0b", // Amber
	"#eab308", // Yellow
	"#84cc16", // Lime
	"#22c55e", // Green
	"#14b8a6", // Teal
	"#06b6d4", // Cyan
	"#3b82f6", // Blue
	"#6366f1", // Indigo
	"#8b5cf6", // Violet
	"#ec4899", // Pink
	"#6b7280", // Gray
];

interface CreateCategoryDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (name: string, color: string) => Promise<void>;
	initialName?: string;
	initialColor?: string;
	mode?: "create" | "edit";
}

export function CreateCategoryDialog({
	isOpen,
	onOpenChange,
	onSubmit,
	initialName = "",
	initialColor = "#6366f1",
	mode = "create",
}: CreateCategoryDialogProps) {
	const [name, setName] = useState(initialName);
	const [color, setColor] = useState(initialColor);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setName(initialName);
			setColor(initialColor);
		}
	}, [isOpen, initialName, initialColor]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!name.trim() || isSubmitting) return;

		try {
			setIsSubmitting(true);
			await onSubmit(name, color);
			if (mode === "create") {
				setName("");
				setColor("#6366f1");
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
						{mode === "create" ? "タグを作成" : "タグを編集"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "新しいタグの名前と色を設定してください。"
							: "タグの名前と色を変更します。"}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">タグ名</Label>
						<Input
							id="name"
							placeholder="例: 仕事, 個人, 勉強..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.nativeEvent.isComposing) {
									e.preventDefault();
									handleSubmit();
								}
							}}
							autoFocus
						/>
					</div>
					<div className="grid gap-2">
						<Label>色</Label>
						<div className="flex flex-wrap gap-2">
							{COLOR_PALETTE.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={cn(
										"w-6 h-6 rounded-full transition-all hover:scale-110",
										color === c
											? "ring-2 ring-offset-2 ring-slate-400 scale-110"
											: "hover:ring-2 hover:ring-offset-1 hover:ring-slate-200",
									)}
									style={{ backgroundColor: c }}
									aria-label={`Select color ${c}`}
								/>
							))}
						</div>
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
						disabled={!name.trim() || isSubmitting}
						className="bg-indigo-600 text-white hover:bg-indigo-700"
					>
						{mode === "create" ? "作成" : "保存"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
