import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					// 基本レイアウト
					"flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base md:text-sm outline-none shadow-xs bg-transparent",

					// 色（テーマ変数）
					"border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",

					// フォーカス（Inputと統一・indigoテーマ）
					"focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500",

					// disabled
					"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

					// アニメーション
					"transition-[color,box-shadow]",

					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
