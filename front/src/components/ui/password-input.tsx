import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export function PasswordInput({
	className,
	...props
}: React.ComponentProps<typeof Input>) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className="relative">
			<Input
				type={visible ? "text" : "password"}
				className={cn("pr-10", className)}
				{...props}
			/>
			<button
				type="button"
				aria-label={visible ? "Hide password" : "Show password"}
				onClick={() => setVisible((v) => !v)}
				className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
			>
				{visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
			</button>
		</div>
	);
}
