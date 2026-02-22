import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// 簡単な proxy 設定例
export default defineConfig({
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
			"/api": {
				target: "http://bff-server:7070",
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
