import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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

export const PomodoroSettings = () => {
	const { settings, fetchSettings, updateSettings } = usePomodoroStore();
	const [inputValues, setInputValues] = useState<{
		focusDuration: string;
		shortBreakDuration: string;
		longBreakDuration: string;
		longBreakInterval: string;
		dailyGoal: string;
	}>({
		focusDuration: (settings.focusDuration ?? 25).toString(),
		shortBreakDuration: (settings.shortBreakDuration ?? 5).toString(),
		longBreakDuration: (settings.longBreakDuration ?? 15).toString(),
		longBreakInterval: (settings.longBreakInterval ?? 4).toString(),
		dailyGoal: (settings.dailyGoal ?? 120).toString(),
	});

	// Sync local state when settings change from store (e.g. fetch or preset click)
	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	useEffect(() => {
		setInputValues({
			focusDuration: (settings.focusDuration ?? 25).toString(),
			shortBreakDuration: (settings.shortBreakDuration ?? 5).toString(),
			longBreakDuration: (settings.longBreakDuration ?? 15).toString(),
			longBreakInterval: (settings.longBreakInterval ?? 4).toString(),
			dailyGoal: (settings.dailyGoal ?? 120).toString(),
		});
	}, [
		settings.focusDuration,
		settings.shortBreakDuration,
		settings.longBreakDuration,
		settings.longBreakInterval,
		settings.dailyGoal,
	]);

	const handleDurationChange = (
		key: keyof typeof inputValues,
		value: string,
	) => {
		// Always update local state to allow typing/clearing
		setInputValues((prev) => ({ ...prev, [key]: value }));

		const numValue = parseInt(value, 10);
		// Only update store if value is valid
		if (!Number.isNaN(numValue) && numValue > 0) {
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
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-3">
							<Label htmlFor="focusDuration">Focus Duration (min)</Label>
							<Input
								id="focusDuration"
								type="number"
								min="1"
								placeholder={(settings.focusDuration ?? 25).toString()}
								value={inputValues.focusDuration}
								onChange={(e) =>
									handleDurationChange("focusDuration", e.target.value)
								}
							/>
							<div className="flex flex-wrap gap-2">
								{[15, 25, 50, 90].map((duration) => (
									<Button
										key={duration}
										variant={
											settings.focusDuration === duration
												? "default"
												: "outline"
										}
										size="sm"
										onClick={() => updateSettings({ focusDuration: duration })}
										className="h-7 px-2 text-xs"
									>
										{duration}m
									</Button>
								))}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="shortBreakDuration">Short Break (min)</Label>
							<Input
								id="shortBreakDuration"
								type="number"
								min="1"
								placeholder={(settings.shortBreakDuration ?? 5).toString()}
								value={inputValues.shortBreakDuration}
								onChange={(e) =>
									handleDurationChange("shortBreakDuration", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="longBreakDuration">Long Break (min)</Label>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="longBreakEnabled"
										checked={settings.isLongBreakEnabled}
										onCheckedChange={(checked) =>
											updateSettings({ isLongBreakEnabled: checked === true })
										}
									/>
									<span className="text-xs text-muted-foreground">Enable</span>
								</div>
							</div>
							<Input
								id="longBreakDuration"
								type="number"
								min="1"
								disabled={!settings.isLongBreakEnabled}
								placeholder={(settings.longBreakDuration ?? 15).toString()}
								value={inputValues.longBreakDuration}
								onChange={(e) =>
									handleDurationChange("longBreakDuration", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="longBreakInterval">Long Break Interval</Label>
							<Input
								id="longBreakInterval"
								type="number"
								min="1"
								disabled={!settings.isLongBreakEnabled}
								placeholder={(settings.longBreakInterval ?? 4).toString()}
								value={inputValues.longBreakInterval}
								onChange={(e) =>
									handleDurationChange("longBreakInterval", e.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="dailyGoal">Daily Goal (min)</Label>
							<Input
								id="dailyGoal"
								type="number"
								min="1"
								placeholder={(settings.dailyGoal ?? 120).toString()}
								value={inputValues.dailyGoal}
								onChange={(e) =>
									handleDurationChange("dailyGoal", e.target.value)
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
