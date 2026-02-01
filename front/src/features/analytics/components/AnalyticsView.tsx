import { useState } from "react";
import { cn } from "@/lib/utils";
import DailyView from "./Daily/DailyView";
import MonthlyView from "./Monthly/MonthlyView";
import WeeklyView from "./Weekly/WeeklyView";

type ViewType = "daily" | "weekly" | "monthly";

export default function AnalyticsView() {
	const [view, setView] = useState<ViewType>("daily");

	return (
		<div className="h-full flex flex-col p-4 gap-3">
			{/* Header */}
			<div className="shrink-0 flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold">Analytics</h1>
					<p className="text-muted-foreground text-xs">
						Overview of your activity and performance
					</p>
				</div>

				{/* View Tabs */}
				<div className="flex border rounded-lg p-0.5 bg-muted/50">
					{(["daily", "weekly", "monthly"] as const).map((v) => (
						<button
							type="button"
							key={v}
							onClick={() => setView(v)}
							className={cn(
								"px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
								view === v
									? "bg-background shadow-sm text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{v}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 min-h-0 overflow-x-hidden overflow-y-hidden">
				{view === "daily" && <DailyView />}
				{view === "weekly" && <WeeklyView />}
				{view === "monthly" && <MonthlyView />}
			</div>
		</div>
	);
}
