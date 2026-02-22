import { useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Plus, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAiPreviewStore } from "@/features/ai/stores/useAiPreviewStore";
import { isExistingTask, toSyncTask } from "@/features/ai/utils/aiUtils";
import { taskKeys } from "@/features/task/queries/queryKeys";
import { useSyncTasksMutation } from "@/features/task/queries/task/useMiscMutations";
import { useTaskListsQuery } from "@/features/todo/queries/useTaskQueries";

export function AiSaveButton() {
	const { aiPreviewTasks, setAiPreviewTasks } = useAiPreviewStore();
	const { data: taskLists = [] } = useTaskListsQuery();
	const { mutateAsync: syncTasks } = useSyncTasksMutation();
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);

	const selectedTasks = aiPreviewTasks.filter((t) => t.selected);
	const selectedTaskCount = selectedTasks.length;

	if (selectedTaskCount === 0) return null;

	const modifiedTaskCount = selectedTasks.filter(isExistingTask).length;

	const groupedLists = new Set(
		selectedTasks.map((t) => t.taskListTitle).filter(Boolean),
	);

	const newListCount = Array.from(groupedLists).filter(
		(name) => !taskLists.some((l) => l.title === name),
	).length;

	const handleSave = async () => {
		if (selectedTaskCount === 0) return;
		setIsLoading(true);

		try {
			const syncPayload = selectedTasks.map(toSyncTask);
			const result = await syncTasks(syncPayload);

			if (result.success) {
				setAiPreviewTasks([]);
				queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			}
			// Note: useSyncTasksMutation handles toasts natively
		} catch {
			// Error handled by the mutation
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
			<Button
				onClick={handleSave}
				disabled={isLoading}
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
