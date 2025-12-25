import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryStore } from "@/store/useCategoryStore";

// 12色のプリセットカラーパレット
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
];

// カラーピッカーコンポーネント
const ColorPicker = ({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) => (
	<div className="flex flex-wrap gap-1.5">
		{COLOR_PALETTE.map((color) => (
			<button
				key={color}
				type="button"
				onClick={() => onChange(color)}
				className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
					value === color
						? "border-gray-800 ring-2 ring-offset-1 ring-gray-400"
						: "border-transparent hover:border-gray-300"
				}`}
				style={{ backgroundColor: color }}
				aria-label={`Select color ${color}`}
			/>
		))}
	</div>
);

export const CategorySettings = () => {
	const {
		categories,
		fetchCategories,
		createCategory,
		updateCategory,
		deleteCategory,
	} = useCategoryStore();
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryColor, setNewCategoryColor] = useState("#6366f1"); // Indigo-500 default
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState("");

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const handleCreate = async () => {
		if (!newCategoryName.trim()) return;
		await console.log("create new category", newCategoryName, newCategoryColor);
		await createCategory(newCategoryName, newCategoryColor);
		setNewCategoryName("");
		setNewCategoryColor("#6366f1");
	};

	const startEditing = (category: {
		id: number;
		name: string;
		color?: string;
	}) => {
		setEditingId(category.id);
		setEditName(category.name);
		setEditColor(category.color || "#6366f1");
	};

	const handleUpdate = async () => {
		if (editingId && editName.trim()) {
			await updateCategory(editingId, { name: editName, color: editColor });
			setEditingId(null);
		}
	};

	const handleDelete = async (id: number) => {
		if (confirm("Are you sure you want to delete this category?")) {
			await deleteCategory(id);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Manage Categories</CardTitle>
					<CardDescription>
						Create and organize your task categories.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Create New Category */}
					<div className="p-4 bg-muted/50 rounded-lg border border-dashed space-y-4">
						<div className="flex items-end gap-3">
							<div className="flex-1 space-y-2">
								<Label htmlFor="newCategoryName">New Category Name</Label>
								<Input
									id="newCategoryName"
									placeholder="e.g. Work, Personal"
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleCreate()}
								/>
							</div>
							<Button onClick={handleCreate} disabled={!newCategoryName.trim()}>
								<Plus className="w-4 h-4 mr-2" />
								Add
							</Button>
						</div>
						<div className="space-y-2">
							<Label>Color</Label>
							<ColorPicker
								value={newCategoryColor}
								onChange={setNewCategoryColor}
							/>
						</div>
					</div>

					{/* Category List */}
					<div className="space-y-2">
						{categories.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								No categories found. Create one above!
							</p>
						) : (
							categories.map((category) => (
								<div
									key={category.id}
									className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm group hover:border-indigo-200 transition-colors"
								>
									{editingId === category.id ? (
										// Edit Mode
										<div className="flex flex-col gap-3 w-full animate-in fade-in duration-200">
											<div className="flex items-center gap-3">
												<div
													className="w-6 h-6 rounded-full border border-black/10 shadow-sm flex-shrink-0"
													style={{ backgroundColor: editColor }}
												/>
												<Input
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													className="flex-1"
													autoFocus
													onKeyDown={(e) => {
														if (e.key === "Enter") handleUpdate();
														if (e.key === "Escape") setEditingId(null);
													}}
												/>
												<Button
													size="icon"
													variant="ghost"
													onClick={handleUpdate}
													className="text-green-600 hover:text-green-700 hover:bg-green-50"
												>
													<Check className="w-4 h-4" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													onClick={() => setEditingId(null)}
													className="text-gray-500 hover:text-gray-700"
												>
													<X className="w-4 h-4" />
												</Button>
											</div>
											<ColorPicker value={editColor} onChange={setEditColor} />
										</div>
									) : (
										// Display Mode
										<>
											<div className="flex items-center gap-3">
												<div
													className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
													style={{ backgroundColor: category.color }}
												/>
												<span className="font-medium text-gray-700">
													{category.name}
												</span>
											</div>
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													size="icon"
													variant="ghost"
													onClick={() => startEditing(category)}
												>
													<Pencil className="w-4 h-4 text-gray-500" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													onClick={() => handleDelete(category.id)}
													className="text-red-500 hover:text-red-600 hover:bg-red-50"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</>
									)}
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
