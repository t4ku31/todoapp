import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategorySettings } from "@/features/settings/components/CategorySettings";
import { PomodoroSettings } from "@/features/settings/components/PomodoroSettings";

export default function SettingsPage() {
	return (
		<div className="h-full flex flex-col p-6 gap-6">
			<div className="flex items-center gap-2">
				<Settings className="w-8 h-8 text-gray-700" />
				<h1 className="text-3xl font-bold text-gray-800">Settings</h1>
			</div>

			<Tabs defaultValue="pomodoro" className="w-full">
				<TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
					<TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
					<TabsTrigger value="categories">Categories</TabsTrigger>
				</TabsList>
				<TabsContent value="pomodoro" className="mt-6">
					<PomodoroSettings />
				</TabsContent>
				<TabsContent value="categories" className="mt-6">
					<CategorySettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}
