import { FolderPlus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiPreviewStore } from "@/features/ai/stores/useAiPreviewStore";
import { isExistingTask } from "@/features/ai/utils/aiUtils";
import { useTodoStore } from "@/store/useTodoStore";

export function AiSaveButton() {
	const { aiPreviewTasks, saveAiPreviewTasks, loading } = useAiPreviewStore();
	const taskLists = useTodoStore((state) => state.taskLists);

	const selectedTasks = aiPreviewTasks.filter((t) => t.selected);
	const selectedTaskCount = selectedTasks.length;

	if (selectedTaskCount === 0) return null;

	const modifiedTaskCount = selectedTasks.filter(isExistingTask).length;

	// Check if any new lists are being created (simple check based on suggestedTaskList having items without originalId that imply new list... actually store implementation handles this on backend)
	// But for UI label, we check if any task suggests a list that might be new?
	// AiTaskPreviewList had complex logic for "New List".
	// Replicating:
	const groupedLists = new Set(
		selectedTasks.map((t) => t.taskListTitle).filter(Boolean),
	);
	// We don't easily know if the list is new or existing without comparing to taskLists.
	// But let's simplify for now or access taskLists from store.

	const newListCount = Array.from(groupedLists).filter(
		(name) => !taskLists.some((l) => l.title === name),
	).length;

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
			<Button
				onClick={saveAiPreviewTasks}
				disabled={loading}
				className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-full px-6 py-6"
				size="lg"
			>
				{newListCount > 0 ? (
					<>
						<FolderPlus className="h-5 w-5 mr-2" />
						リスト作成 & 保存 ({selectedTaskCount}件)
					</>
				) : modifiedTaskCount > 0 ? (
					<>
						<Save className="h-5 w-5 mr-2" />
						変更を保存 ({selectedTaskCount}件)
					</>
				) : (
					<>
						<Plus className="h-5 w-5 mr-2" />
						タスクを追加 ({selectedTaskCount}件)
					</>
				)}
			</Button>
		</div>
	);
}
