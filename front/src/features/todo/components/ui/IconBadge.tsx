import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ColorScheme = "indigo" | "amber" | "rose" | "gray";

interface IconBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: LucideIcon;
	children: ReactNode;
	variant?: "default" | "outline" | "category" | "solid";
	color?: string; // For category variant - custom background/text color
	colorScheme?: ColorScheme; // For solid variant - predefined color schemes
}

const colorSchemeStyles: Record<ColorScheme, string> = {
	indigo: "bg-indigo-500 text-white hover:bg-indigo-600",
	amber: "bg-amber-400 text-white hover:bg-amber-500",
	rose: "bg-rose-500 text-white hover:bg-rose-600",
	gray: "bg-gray-500 text-white hover:bg-gray-600",
};

export const IconBadge = forwardRef<HTMLButtonElement, IconBadgeProps>(
	(
		{
			icon: Icon,
			children,
			variant = "default",
			color,
			colorScheme = "indigo",
			className,
			...props
		},
		ref,
	) => {
		// Base styles shared by all variants
		const baseStyles =
			"inline-flex items-center gap-1 px-3 py-0.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 hover:scale-105";

		// Variant-specific styles
		const variantStyles = {
			default:
				"bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-150",
			outline:
				"bg-white text-gray-700 border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50",
			category: "", // Custom color-based
			solid: colorSchemeStyles[colorScheme],
		};

		// Build category styles if color is provided
		const categoryStyles = color
			? {
					backgroundColor: `${color}15`,
					color: color,
					borderColor: `${color}40`,
				}
			: {};

		return (
			<button
				ref={ref}
				type="button"
				className={cn(
					baseStyles,
					variant === "category" ? "border" : "",
					variant !== "category" && variantStyles[variant],
					className,
				)}
				style={variant === "category" ? categoryStyles : undefined}
				{...props}
			>
				<Icon className="w-3.5 h-3.5 shrink-0" />
				<span className="truncate max-w-[100px]">{children}</span>
			</button>
		);
	},
);

IconBadge.displayName = "IconBadge";
