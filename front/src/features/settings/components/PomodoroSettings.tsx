import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { Volume2, VolumeX } from "lucide-react";

export const PomodoroSettings = () => {
	const { settings, updateSettings } = usePomodoroStore();

	const handleDurationChange = (key: keyof typeof settings, value: string) => {
		const numValue = parseInt(value, 10);
		if (!isNaN(numValue) && numValue > 0) {
			updateSettings({ [key]: numValue });
		}
	};

	const handleVolumeChange = (value: number) => {
		updateSettings({ volume: value });
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Timer Configuration</CardTitle>
					<CardDescription>
						Adjust the duration of your focus and break sessions.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="focusDuration">Focus Duration (min)</Label>
							<Input
								id="focusDuration"
								type="number"
								min="1"
								value={settings.focusDuration}
								onChange={(e) =>
									handleDurationChange("focusDuration", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="shortBreakDuration">Short Break (min)</Label>
							<Input
								id="shortBreakDuration"
								type="number"
								min="1"
								value={settings.shortBreakDuration}
								onChange={(e) =>
									handleDurationChange("shortBreakDuration", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="longBreakDuration">Long Break (min)</Label>
							<Input
								id="longBreakDuration"
								type="number"
								min="1"
								value={settings.longBreakDuration}
								onChange={(e) =>
									handleDurationChange("longBreakDuration", e.target.value)
								}
							/>
						</div>
					</div>
					<div className="flex items-center space-x-2 pt-2">
						<Checkbox
							id="autoAdvance"
							checked={settings.autoAdvance}
							onCheckedChange={(checked) =>
								updateSettings({ autoAdvance: checked === true })
							}
						/>
						<Label htmlFor="autoAdvance" className="cursor-pointer">
							Auto-start next phase (Focus/Break)
						</Label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Sound & Ambience</CardTitle>
					<CardDescription>
						Customize your audio environment during focus sessions.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="whiteNoise">White Noise</Label>
						<Select
							value={settings.whiteNoise}
							onValueChange={(value) => updateSettings({ whiteNoise: value })}
						>
							<SelectTrigger id="whiteNoise">
								<SelectValue placeholder="Select sound" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None (Silent)</SelectItem>
								<SelectItem value="rain">Rain Sounds</SelectItem>
								<SelectItem value="cafe">Cafe Ambience</SelectItem>
								<SelectItem value="white_noise">Pure White Noise</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="volume">
								Master Volume ({Math.round(settings.volume * 100)}%)
							</Label>
							{settings.volume === 0 ? (
								<VolumeX className="w-4 h-4 text-gray-500" />
							) : (
								<Volume2 className="w-4 h-4 text-gray-500" />
							)}
						</div>
						<input
							id="volume"
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={settings.volume}
							onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
							className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
