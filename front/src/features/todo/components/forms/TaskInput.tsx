import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CalendarCheck2, CalendarIcon } from "lucide-react";
import { forwardRef } from "react";

export interface TaskInputState {
	title: string;
	dueDate?: Date;
	executionDate?: Date;
}

interface TaskInputProps {
	value: TaskInputState;
	onChange: (value: TaskInputState) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	disabled?: boolean;
	placeholder?: string;
	autoFocus?: boolean;
	className?: string;
	endAdornment?: React.ReactNode;
}

export const TaskInput = forwardRef<HTMLInputElement, TaskInputProps>(
	(
		{
			value,
			onChange,
			onKeyDown,
			disabled,
			placeholder,
			autoFocus,
			className,
			endAdornment,
		},
		ref,
	) => {
		const handleChange = (field: keyof TaskInputState, fieldValue: any) => {
			onChange({ ...value, [field]: fieldValue });
		};

		return (
			<div className={cn("flex items-center gap-2", className)}>
				<Input
					ref={ref}
					value={value.title}
					onChange={(e) => handleChange("title", e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={placeholder}
					autoFocus={autoFocus}
					disabled={disabled}
					className="h-8 text-sm flex-1"
				/>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={disabled}
										className={cn(
											"h-8 w-8 p-0 text-muted-foreground",
											value.dueDate && "text-foreground border-primary",
										)}
									>
										<CalendarIcon className="h-4 w-4" />
										<span className="sr-only">Due Date</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<div className="p-2 border-b text-xs font-semibold text-center">
										期限 (Due Date)
									</div>
									<Calendar
										mode="single"
										selected={value.dueDate}
										onSelect={(date) => handleChange("dueDate", date)}
										className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</TooltipTrigger>
						<TooltipContent>
							<p>期限 (Due Date)</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={disabled}
										className={cn(
											"h-8 w-8 p-0 text-muted-foreground",
											value.executionDate && "text-foreground border-blue-500",
										)}
									>
										<CalendarCheck2 className="h-4 w-4" />
										<span className="sr-only">Execution Date</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<div className="p-2 border-b text-xs font-semibold text-center text-blue-600">
										実行日 (Execution Date)
									</div>
									<Calendar
										mode="single"
										selected={value.executionDate}
										onSelect={(date) => handleChange("executionDate", date)}
										className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</TooltipTrigger>
						<TooltipContent>
							<p>実行日 (Execution Date)</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{endAdornment}
			</div>
		);
	},
);

TaskInput.displayName = "TaskInput";
