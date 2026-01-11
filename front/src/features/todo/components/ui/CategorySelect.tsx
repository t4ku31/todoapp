import { Tag } from "lucide-react";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { IconBadge } from "./IconBadge";

interface CategorySelectProps {
	selectedCategoryId?: number;
	onCategoryChange: (categoryId: number) => void;
	onOpenChange?: (open: boolean) => void;
	className?: string;
}

export function CategorySelect({
	selectedCategoryId,
	onCategoryChange,
	onOpenChange,
	className,
}: CategorySelectProps) {
	const categories = useCategoryStore((state) => state.categories);
	const [open, setOpen] = useState(false);

	const handleSelectCategory = (categoryId: number) => {
		onCategoryChange(categoryId);
		setOpen(false);
		onOpenChange?.(false);
	};

	const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

	return (
		<Popover
			open={open}
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				onOpenChange?.(newOpen);
			}}
		>
			<PopoverTrigger asChild>
				<IconBadge
					icon={Tag}
					variant={selectedCategory ? "category" : "outline"}
					color={selectedCategory?.color}
					className={className}
					onPointerDown={(e) => e.stopPropagation()}
				>
					{selectedCategory?.name || "タグ"}
				</IconBadge>
			</PopoverTrigger>
			<PopoverContent
				className="w-[200px] p-0"
				align="start"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<ScrollArea className="h-48 p-2">
					<div className="space-y-1">
						{categories.length === 0 && (
							<div className="text-xs text-center text-muted-foreground py-4">
								No categories found
							</div>
						)}
						{categories.map((category) => (
							<button
								key={category.id}
								type="button"
								className={cn(
									"w-full flex items-center gap-2 p-2 rounded-sm cursor-pointer text-left text-sm transition-colors",
									selectedCategoryId === category.id
										? "bg-accent text-accent-foreground"
										: "hover:bg-accent hover:text-accent-foreground",
								)}
								onClick={() => handleSelectCategory(category.id)}
							>
								{category.color && (
									<div
										className="w-3 h-3 rounded-full shrink-0"
										style={{ backgroundColor: category.color }}
									/>
								)}
								<span className="truncate">{category.name}</span>
							</button>
						))}
					</div>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
