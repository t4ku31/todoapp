import {
	CalendarDays,
	CalendarRange,
	CheckSquare,
	Inbox,
	MoreHorizontal,
	Pencil,
	Search,
	Tag,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAiPreviewStore } from "@/features/ai/stores/useAiPreviewStore";
import { useSidebarStats } from "@/features/task/hooks/useSidebarStats";
import {
	useCreateCategoryMutation,
	useDeleteCategoryMutation,
	useUpdateCategoryMutation,
} from "@/features/task/queries/category/useCategoryMutations";
import { useCategoriesQuery } from "@/features/task/queries/category/useCategoryQueries";
import {
	useCreateTaskListMutation,
	useDeleteTaskListMutation,
	useUpdateTaskListTitleMutation,
} from "@/features/task/queries/task/useTaskListMutations";
import { useTaskListsQuery } from "@/features/task/queries/task/useTaskQueries";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "../forms/CreateCategoryDialog";
import { CreateListDialog } from "../forms/CreateListDialog";
import { DroppableNavItem } from "./DroppableNavItem";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSection } from "./SidebarSection";

interface TaskSidebarProps {
	className?: string;
}

export function TaskSidebar({ className }: TaskSidebarProps) {
	const navigate = useNavigate();
	const { data: taskLists = [] } = useTaskListsQuery();
	const createTaskList = useCreateTaskListMutation();
	const updateTaskListTitle = useUpdateTaskListTitleMutation();
	const deleteTaskList = useDeleteTaskListMutation();

	const { data: categories = [] } = useCategoriesQuery();
	const createCategory = useCreateCategoryMutation();
	const updateCategory = useUpdateCategoryMutation();
	const deleteCategory = useDeleteCategoryMutation();
	const { aiPreviewTasks } = useAiPreviewStore();

	const [isListDialogOpen, setIsListDialogOpen] = useState(false);
	const [editingList, setEditingList] = useState<{
		id: number;
		title: string;
	} | null>(null);
	const [deleteListId, setDeleteListId] = useState<number | null>(null);

	const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<{
		id: number;
		name: string;
		color: string;
	} | null>(null);
	const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

	// Stats Hook
	const { getTodayCount, getNext7DaysCount, getInboxCount, getListTaskCount } =
		useSidebarStats(taskLists);

	// List Handlers
	const handleListSubmit = async (title: string) => {
		if (editingList) {
			updateTaskListTitle.mutate({ taskListId: editingList.id, title });
			setEditingList(null);
		} else {
			createTaskList.mutate(title, {
				onSuccess: (newList) => navigate(`/tasks/list/${newList.id}`),
			});
		}
	};

	const openEditList = (list: { id: number; title: string }) => {
		setEditingList(list);
		setIsListDialogOpen(true);
	};

	const onListDialogOpenChange = (open: boolean) => {
		setIsListDialogOpen(open);
		if (!open) setEditingList(null);
	};

	// Category Handlers
	const handleCategorySubmit = async (name: string, color: string) => {
		if (editingCategory) {
			await updateCategory.mutateAsync({
				id: editingCategory.id,
				updates: { name, color },
			});
			setEditingCategory(null);
		} else {
			const newCategory = await createCategory.mutateAsync({ name, color });
			navigate(`/tasks/category/${newCategory.id}`);
		}
	};

	const openEditCategory = (category: {
		id: number;
		name: string;
		color?: string;
	}) => {
		setEditingCategory({
			id: category.id,
			name: category.name,
			color: category.color || "#6366f1",
		});
		setIsCategoryDialogOpen(true);
	};

	const onCategoryDialogOpenChange = (open: boolean) => {
		setIsCategoryDialogOpen(open);
		if (!open) setEditingCategory(null);
	};

	const aiCountsByListTitle = useMemo(() => {
		const counts = new Map<string, number>();
		for (const task of aiPreviewTasks) {
			const title = task.taskListTitle;
			if (title) {
				counts.set(title, (counts.get(title) || 0) + 1);
			}
		}
		return counts;
	}, [aiPreviewTasks]);

	const newAiLists = useMemo(() => {
		return Array.from(aiCountsByListTitle.entries())
			.filter(([title]) => !taskLists.some((l) => l.title === title))
			.map(([title, count]) => ({ title, count }));
	}, [aiCountsByListTitle, taskLists]);

	return (
		<div
			className={cn(
				"w-56 flex flex-col h-full",
				"bg-slate-50/60 backdrop-blur-xl border-r border-slate-50/50 shadow-sm",
				className,
			)}
		>
			{/* Search Bar */}
			<div className="px-3 pt-4 pb-2">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
					<Input
						type="text"
						placeholder="タスクを検索..."
						className="pl-8"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								const query = (
									e.currentTarget as HTMLInputElement
								).value.trim();
								if (query) {
									navigate(`/tasks/search?q=${encodeURIComponent(query)}`);
								}
							}
						}}
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto min-h-0">
				{/* Quick Views */}
				<div className="px-2 pt-2 space-y-1">
					<DroppableNavItem
						droppableId="today"
						icon={CalendarDays}
						label="今日"
						path="/tasks/today"
						count={getTodayCount()}
					/>
					<SidebarNavItem
						icon={CalendarRange}
						label="次の7日間"
						path="/tasks/week"
						count={getNext7DaysCount()}
					/>
					<DroppableNavItem
						droppableId="inbox"
						icon={Inbox}
						label="受信トレイ"
						path="/tasks/inbox"
						count={getInboxCount()}
					/>
				</div>

				{/* Lists Section */}
				<SidebarSection title="リスト" onAdd={() => setIsListDialogOpen(true)}>
					<div className="px-2 space-y-2">
						{taskLists
							.filter((list) => list.title !== "Inbox")
							.map((list) => (
								<DroppableNavItem
									key={list.id}
									droppableId={`tasklist-${list.id}`}
									icon={CheckSquare}
									label={list.title}
									path={`/tasks/list/${list.id}`}
									count={getListTaskCount(list.id)}
									aiCount={aiCountsByListTitle.get(list.title)}
									actions={
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-gray-400 hover:text-gray-600"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEditList(list)}>
													<Pencil className="mr-2 h-4 w-4" />
													名前を変更
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setDeleteListId(list.id)}
													className="text-red-600 focus:text-red-600"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													削除
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									}
								/>
							))}
						{taskLists.filter((l) => l.title !== "Inbox").length === 0 &&
							newAiLists.length === 0 && (
								<p className="text-xs text-gray-400 px-3 py-2">
									リストがありません
								</p>
							)}
						{newAiLists.map(({ title, count }) => (
							<div
								key={`new-list-${title}`}
								className="px-3 py-2 rounded-lg text-sm text-gray-400 italic flex justify-between items-center group/item hover:bg-slate-50 transition-colors"
							>
								<div className="flex items-center gap-3 min-w-0 flex-1">
									<CheckSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
									<span className="truncate">{title}</span>
								</div>
								<span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 animate-pulse">
									+{count}
								</span>
							</div>
						))}
					</div>
				</SidebarSection>

				{/* Tags Section */}
				<SidebarSection
					title="タグ"
					onAdd={() => setIsCategoryDialogOpen(true)}
				>
					<div className="px-2 space-y-1 mt-1">
						{categories.map((category) => (
							<DroppableNavItem
								key={category.id}
								droppableId={`category-${category.id}`}
								icon={Tag}
								label={category.name}
								path={`/tasks/category/${category.id}`}
								color={category.color}
								actions={
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-gray-400 hover:text-gray-600"
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => openEditCategory(category)}
											>
												<Pencil className="mr-2 h-4 w-4" />
												編集
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setDeleteCategoryId(category.id)}
												className="text-red-600 focus:text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												削除
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								}
							/>
						))}
						{categories.length === 0 && (
							<p className="text-xs text-gray-400 px-3 py-2">
								タグがありません
							</p>
						)}
					</div>
				</SidebarSection>

				{/* Spacer */}
				<div className="h-4" />
			</div>

			{/* Bottom Section */}
			<div className="px-2 pb-4 space-y-1 border-t border-gray-100 pt-4">
				<SidebarNavItem
					icon={CheckSquare}
					label="完了"
					path="/tasks/completed"
				/>
				<SidebarNavItem icon={Trash2} label="ゴミ箱" path="/tasks/trash" />
			</div>

			{/* Dialogs */}
			<CreateListDialog
				isOpen={isListDialogOpen}
				onOpenChange={onListDialogOpenChange}
				onSubmit={handleListSubmit}
				initialTitle={editingList?.title}
				mode={editingList ? "edit" : "create"}
			/>

			<CreateCategoryDialog
				isOpen={isCategoryDialogOpen}
				onOpenChange={onCategoryDialogOpenChange}
				onSubmit={handleCategorySubmit}
				initialName={editingCategory?.name}
				initialColor={editingCategory?.color}
				mode={editingCategory ? "edit" : "create"}
			/>

			<AlertDialog
				open={!!deleteListId}
				onOpenChange={(open) => !open && setDeleteListId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作は取り消せません。リスト内のすべてのタスクも完全に削除されます。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteListId(null)}>
							キャンセル
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteListId) {
									deleteTaskList.mutate(deleteListId, {
										onSuccess: () => {
											setDeleteListId(null);
											navigate("/tasks/inbox");
										},
									});
								}
							}}
							className="bg-red-600 hover:bg-red-700"
						>
							削除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!deleteCategoryId}
				onOpenChange={(open) => !open && setDeleteCategoryId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>タグを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							このタグはすべてのタスクから削除されますが、タスク自体は削除されません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteCategoryId(null)}>
							キャンセル
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								if (deleteCategoryId) {
									await deleteCategory.mutateAsync(deleteCategoryId);
									setDeleteCategoryId(null);
									navigate("/tasks/inbox");
								}
							}}
							className="bg-red-600 hover:bg-red-700"
						>
							削除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
