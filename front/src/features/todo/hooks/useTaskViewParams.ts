import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import { useLocation, useSearchParams } from "react-router-dom";

export type ViewType =
	| "today"
	| "week"
	| "inbox"
	| "list"
	| "category"
	| "completed"
	| "trash"
	| "search"
	| "all";

export function useTaskViewParams() {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const { taskLists } = useTodoStore();
	const { categories } = useCategoryStore();

	const searchQuery = searchParams.get("q") || "";

	// Helper to extract ID from path
	const getIdFromPath = (): number | null => {
		const path = location.pathname;
		const listMatch = path.match(/\/tasks\/list\/(\d+)/);
		if (listMatch) return Number(listMatch[1]);
		const categoryMatch = path.match(/\/tasks\/category\/(\d+)/);
		if (categoryMatch) return Number(categoryMatch[1]);
		return null;
	};

	const pathId = getIdFromPath();

	// Determine view type from URL
	const getViewType = (): ViewType => {
		const path = location.pathname;
		if (path.includes("/tasks/today")) return "today";
		if (path.includes("/tasks/week")) return "week";
		if (path.includes("/tasks/inbox")) return "inbox";
		if (path.match(/\/tasks\/list\/\d+/)) return "list";
		if (path.match(/\/tasks\/category\/\d+/)) return "category";
		if (path.includes("/tasks/completed")) return "completed";
		if (path.includes("/tasks/trash")) return "trash";
		if (path.includes("/tasks/search")) return "search";
		return "all";
	};

	const viewType = getViewType();

	// Get title based on view
	const getTitle = (): string => {
		switch (viewType) {
			case "today":
				return "今日";
			case "week":
				return "次の7日間";
			case "inbox":
				return "受信トレイ";
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				return list?.title || "リスト";
			}
			case "category": {
				const category = categories.find((c) => c.id === pathId);
				return category?.name || "カテゴリ";
			}
			case "completed":
				return "完了";
			case "trash":
				return "ゴミ箱";
			case "search":
				return `検索: ${searchQuery}`;
			default:
				return "すべてのタスク";
		}
	};

	// Get default task list ID for creating new tasks
	const getDefaultTaskListId = (): number => {
		if (viewType === "list" && pathId) {
			return pathId;
		}
		if (viewType === "inbox") {
			const inboxList = taskLists.find((l) => l.title === "Inbox");
			return inboxList?.id || taskLists[0]?.id || 0;
		}
		return taskLists[0]?.id || 0;
	};

	return {
		viewType,
		pathId,
		searchQuery,
		title: getTitle(),
		defaultTaskListId: getDefaultTaskListId(),
	};
}
