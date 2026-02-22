import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	onAdd?: () => void;
}

export function SidebarSection({
	title,
	children,
	defaultOpen = true,
	onAdd,
}: SidebarSectionProps) {
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
