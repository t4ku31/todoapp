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
import { CalendarCheck2 } from "lucide-react";
import { type Control, Controller } from "react-hook-form";
import { CategorySelect } from "../ui/CategorySelect";

interface TaskInputProps {
	// biome-ignore lint/suspicious/noExplicitAny: Generic control for reusability
	control: Control<any>;
	// prefix for field names, e.g. "tasks.0" or undefined for root fields
	namePrefix?: string;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	disabled?: boolean;
	placeholder?: string;
	autoFocus?: boolean;
	className?: string;
	endAdornment?: React.ReactNode;
}

export const TaskInput = ({
	control,
	namePrefix,
	onKeyDown,
	disabled,
	placeholder,
	autoFocus,
	className,
	endAdornment,
	showExecutionDate = true,
}: TaskInputProps & { showExecutionDate?: boolean }) => {
	const getFieldName = (field: string) =>
		namePrefix ? `${namePrefix}.${field}` : field;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Controller
				control={control}
				name={getFieldName("title")}
				render={({ field }) => (
					<Input
						{...field}
						onKeyDown={onKeyDown}
						placeholder={placeholder}
						autoFocus={autoFocus}
						disabled={disabled}
						className="h-8 text-sm flex-1"
						value={field.value || ""}
					/>
				)}
			/>



			<Controller
				control={control}
				name={getFieldName("categoryId")}
				render={({ field }) => (
					<CategorySelect
						selectedCategoryId={field.value}
						onCategoryChange={(value) => field.onChange(value)}
					/>
				)}
			/>

			{showExecutionDate && (
				<Controller
					control={control}
					name={getFieldName("executionDate")}
					render={({ field }) => (
						<Popover>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={disabled}
												className={cn(
													"h-8 w-8 p-0 text-muted-foreground",
													field.value && "text-foreground border-blue-500",
												)}
											>
												<CalendarCheck2 className="h-4 w-4" />
												<span className="sr-only">Execution Date</span>
											</Button>
										</PopoverTrigger>
									</TooltipTrigger>
									<TooltipContent>
										<p>実行日 (Execution Date)</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<PopoverContent className="w-auto p-0" align="start">
								<div className="p-2 border-b text-xs font-semibold text-center text-blue-600">
									実行日 (Execution Date)
								</div>
								<Calendar
									mode="single"
									selected={field.value}
									onSelect={field.onChange}
									className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					)}
				/>
			)}
			{endAdornment}
		</div>
	);
};

TaskInput.displayName = "TaskInput";
