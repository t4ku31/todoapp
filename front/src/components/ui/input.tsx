import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				// 基本レイアウト
				"flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm outline-none shadow-xs bg-transparent",

				// 色（テーマ変数）
				"border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
				"dark:bg-input/30",

				// フォーカス（Textareaと統一・indigoテーマ）
				"focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500",

				// エラーステート
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",

				// disabled
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

				// file input 用
				"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",

				// アニメーション
				"transition-[color,box-shadow]",

				className,
			)}
			{...props}
		/>
	);
}

export { Input };
