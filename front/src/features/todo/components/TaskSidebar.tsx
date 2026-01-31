import { format } from "date-fns";
import {
	CalendarDays,
	CalendarRange,
	CheckSquare,
	ChevronDown,
	Inbox,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";

import { CreateCategoryDialog } from "./forms/CreateCategoryDialog";
import { CreateListDialog } from "./forms/CreateListDialog";
import { DroppableNavItem } from "./ui/DroppableNavItem";

interface TaskSidebarProps {
	className?: string;
}

interface NavItemProps {
	icon: React.ElementType;
	label: string;
	path: string;
	count?: number;
	color?: string;
	actions?: React.ReactNode;
	aiCount?: number;
}

function NavItem({
	icon: Icon,
	label,
	path,
	count,
	color,
	actions,
	aiCount,
}: NavItemProps) {
	const location = useLocation();
	const isActive = location.pathname === path;

	return (
		<Link
			to={path}
			className={cn(
				"flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 group/item",
				isActive
					? "bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-200"
					: "text-gray-600 hover:bg-indigo-50 hover:text-indigo-900",
			)}
		>
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{color ? (
					<div
						className="h-4 w-4 rounded flex-shrink-0"
						style={{ backgroundColor: color }}
					/>
				) : (
					<Icon className="h-4 w-4 flex-shrink-0" />
				)}
				<span className="truncate">{label}</span>
			</div>
			<div className="flex items-center gap-1">
				{count !== undefined && count > 0 && (
					<span
						className={cn(
							"text-xs font-medium px-1.5 py-0.5 rounded-full",
							isActive
								? "bg-indigo-100 text-indigo-600"
								: "bg-gray-100 text-gray-500",
						)}
					>
						{count}
					</span>
				)}
				{aiCount !== undefined && aiCount > 0 && (
					<span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 animate-pulse">
						+{aiCount}
					</span>
				)}
				{actions && (
					<div
						className="opacity-0 group-hover/item:opacity-100 transition-opacity"
						role="presentation"
						onClickCapture={(e) => e.stopPropagation()}
					>
						{actions}
					</div>
				)}
			</div>
		</Link>
	);
}

interface SectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	onAdd?: () => void;
}

function Section({ title, children, defaultOpen = true, onAdd }: SectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="mt-6">
			<div className="flex items-center justify-between pr-2 group/section">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 group"
				>
					<ChevronDown
						className={cn(
							"h-3.5 w-3.5 transition-transform duration-200 opacity-50 group-hover:opacity-100",
							!isOpen && "-rotate-90",
						)}
					/>
					<span>{title}</span>
				</button>
				{onAdd && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onAdd();
						}}
						className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity"
					>
						<Plus className="h-3.5 w-3.5" />
					</button>
				)}
			</div>
			<div
				className={cn(
					"overflow-hidden transition-all duration-200",
					isOpen ? "max-h-[500px] opacity-100 py-2" : "max-h-0 opacity-0",
				)}
			>
				{children}
			</div>
		</div>
	);
}

export function TaskSidebar({ className }: TaskSidebarProps) {
	const navigate = useNavigate();
	const { taskLists, createTaskList, updateTaskListTitle, deleteTaskList } =
		useTodoStore();
	const { categories, createCategory, updateCategory, deleteCategory } =
		useCategoryStore();
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

	// List Handlers
	const handleListSubmit = async (title: string) => {
		if (editingList) {
			await updateTaskListTitle(editingList.id, title);
			setEditingList(null);
		} else {
			const newList = await createTaskList(title);
			navigate(`/tasks/list/${newList.id}`);
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
			await updateCategory(editingCategory.id, { name, color });
			setEditingCategory(null);
		} else {
			const newCategory = await createCategory(name, color);
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

	// Calculate counts
	// Use date-fns format to get local date string (yyyy-MM-dd)
	const getTodayCount = () => {
		// Use date-fns format to get local date string (yyyy-MM-dd)
		const today = format(new Date(), "yyyy-MM-dd");
		return taskLists.reduce((count, list) => {
			return (
				count +
				(list.tasks?.filter(
					(t) =>
						!t.isDeleted &&
						t.status !== "COMPLETED" &&
						t.executionDate &&
						t.executionDate.startsWith(today),
				).length || 0)
			);
		}, 0);
	};

	const getNext7DaysCount = () => {
		const today = new Date();
		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
		return taskLists.reduce((count, list) => {
			return (
				count +
				(list.tasks?.filter((t) => {
					if (t.isDeleted || t.status === "COMPLETED" || !t.executionDate)
						return false;
					const execDate = new Date(t.executionDate);
					return execDate >= today && execDate <= next7Days;
				}).length || 0)
			);
		}, 0);
	};

	const getInboxCount = () => {
		const inboxList = taskLists.find((l) => l.title === "Inbox");
		return (
			inboxList?.tasks?.filter((t) => !t.isDeleted && t.status !== "COMPLETED")
				.length || 0
		);
	};

	const getListTaskCount = (listId: number) => {
		const list = taskLists.find((l) => l.id === listId);
		return (
			list?.tasks?.filter((t) => !t.isDeleted && t.status !== "COMPLETED")
				.length || 0
		);
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
								const query = (e.target as HTMLInputElement).value.trim();
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
					<NavItem
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
				<Section title="リスト" onAdd={() => setIsListDialogOpen(true)}>
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
				</Section>

				{/* Tags Section */}
				<Section title="タグ" onAdd={() => setIsCategoryDialogOpen(true)}>
					<div className="px-2 space-y-1 mt-1">
						{categories.map((category) => (
							<DroppableNavItem
								key={category.id}
								droppableId={`category-${category.id}`}
								icon={CheckSquare}
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
				</Section>

				{/* Spacer */}
				<div className="h-4" />
			</div>

			{/* Bottom Section */}
			<div className="px-2 pb-4 space-y-1 border-t border-gray-100 pt-4">
				<NavItem icon={CheckSquare} label="完了" path="/tasks/completed" />
				<NavItem icon={Trash2} label="ゴミ箱" path="/tasks/trash" />
			</div>

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
							onClick={async () => {
								if (deleteListId) {
									await deleteTaskList(deleteListId);
									setDeleteListId(null);
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
									await deleteCategory(deleteCategoryId);
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
