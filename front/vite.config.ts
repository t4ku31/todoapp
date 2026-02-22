import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// 簡単な proxy 設定例
export default defineConfig({
	//   base: '/front/',
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 5173,
		allowedHosts: ["todo-app-front-server-1"],
		proxy: {
			//   '/oauth2': {
			//     target: 'http://bff-server:7070',
			//     changeOrigin: true,
			//     secure: false,
			//   },
			"/api": {
				target: "http://bff-server:7070",
				changeOrigin: true,
				secure: false,
			},
			//   '/logout': {
			//     target: 'http://bff-server:8080',
			//     changeOrigin: true,
			//     secure: false,
			//   }
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						// Group core React and related closely-coupled modules
						if (
							id.includes("/react/") ||
							id.includes("/react-dom/") ||
							id.includes("/scheduler/")
						) {
							return "vendor-react";
						}
						// Router
						if (id.includes("react-router")) {
							return "vendor-router";
						}
						// State management and data fetching
						if (id.includes("@tanstack") || id.includes("zustand")) {
							return "vendor-state";
						}
						// UI components and Radix
						if (
							id.includes("@radix-ui") ||
							id.includes("lucide-react") ||
							id.includes("framer-motion") ||
							id.includes("cmdk") ||
							id.includes("sonner")
						) {
							return "vendor-ui";
						}
						// Form handling
						if (id.includes("react-hook-form") || id.includes("@hookform")) {
							return "vendor-form";
						}
						// Complex utilities and libs
						if (
							id.includes("@dnd-kit") ||
							id.includes("recharts") ||
							id.includes("apexcharts") ||
							id.includes("react-big-calendar") ||
							id.includes("react-day-picker")
						) {
							return "vendor-complex-libs";
						}
						if (id.includes("date-fns")) {
							return "vendor-date-fns";
						}
						// Allow Rollup to automatically chunk the rest to prevent circular dependency execution errors
					}
				},
			},
		},
	},
});
