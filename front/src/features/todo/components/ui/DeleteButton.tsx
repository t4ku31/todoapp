import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
	onDelete: () => void;
	title?: string;
	description?: string;
}

export function DeleteButton({
	onDelete,
	title = "タスクを削除しますか？",
	description = "この操作は取り消せません。",
}: DeleteButtonProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					onPointerDown={(e) => e.stopPropagation()}
					className="h-8 w-8 text-gray-400 hover:text-red-500"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onPointerDown={(e) => e.stopPropagation()}>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						onClick={onDelete}
						onPointerDown={(e) => e.stopPropagation()}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						削除
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
