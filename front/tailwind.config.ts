import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			keyframes: {
				wave: {
					"0%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-5px)" },
					"100%": { transform: "translateY(0)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "0% 50%" },
					"100%": { backgroundPosition: "200% 50%" },
				},
			},
			animation: {
				shimmer: "shimmer 3s linear infinite",
			},

			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [],
};
export default config;
