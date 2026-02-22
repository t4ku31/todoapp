import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ColorScheme = "indigo" | "amber" | "rose" | "gray" | "teal";

interface IconBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: LucideIcon;
	children: ReactNode;
	variant?: "default" | "outline" | "category" | "soft";
	color?: string; // For category variant - custom background/text color
	colorScheme?: ColorScheme; // For soft variant - predefined color schemes
}

const colorSchemeStyles: Record<ColorScheme, string> = {
	indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100",
	amber: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
	rose: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100",
	gray: "bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100",
	teal: "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100",
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
			"inline-flex items-center gap-1.5 px-2.5 h-7 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 border shadow-sm hover:scale-105 active:scale-95";

		// Variant-specific styles
		const variantStyles = {
			default:
				"bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
			outline:
				"bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600",
			category: "", // Custom color-based
			soft: colorSchemeStyles[colorScheme],
		};

		// Build category styles if color is provided
		const categoryStyles = color
			? {
					backgroundColor: `${color}10`,
					color: color,
					borderColor: `${color}30`,
				}
			: {};

		return (
			<button
				ref={ref}
				type="button"
				className={cn(
					baseStyles,
					variant === "category" ? "" : variantStyles[variant],
					className,
				)}
				style={variant === "category" ? categoryStyles : undefined}
				{...props}
			>
				<Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
				<span className="truncate max-w-[100px] leading-none">{children}</span>
			</button>
		);
	},
);

IconBadge.displayName = "IconBadge";
