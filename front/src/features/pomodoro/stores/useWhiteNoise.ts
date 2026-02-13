import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { useEffect, useRef } from "react";

// Sound file mapping - keys must match usePomodoroStore.settings.whiteNoise values
const SOUND_FILES: Record<string, string> = {
	white_noise: "/sounds/WhiteNoise.mp3",
	// Add more sounds here later
	// rain: '/sounds/rain.mp3',
	// cafe: '/sounds/cafe.mp3',
};

export function useWhiteNoise() {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const settings = usePomodoroStore((state) => state.settings);
	const isActive = usePomodoroStore((state) => state.isActive);
	const phase = usePomodoroStore((state) => state.phase);

	useEffect(() => {
		const soundFile = SOUND_FILES[settings.whiteNoise];

		// If sound is 'none' or not found, stop and cleanup
		if (!soundFile || settings.whiteNoise === "none") {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			return;
		}

		// Create audio if needed
		if (!audioRef.current) {
			audioRef.current = new Audio(soundFile);
			audioRef.current.loop = true;
			audioRef.current.volume = settings.volume;
		}

		// Play/pause based on timer state
		if (isActive && phase === "focus") {
			audioRef.current.play().catch(() => {
				// Autoplay blocked, need user interaction
				console.log("Autoplay blocked");
			});
		} else {
			audioRef.current.pause();
		}

		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, [settings.whiteNoise, settings.volume, isActive, phase]);

	// Update volume when changed
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = settings.volume;
		}
	}, [settings.volume]);

	return audioRef;
}
