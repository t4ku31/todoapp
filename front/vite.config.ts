import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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
						if (id.includes("react-dom")) return "vendor-react-dom";
						if (id.includes("react-router") || id.includes("react-router-dom"))
							return "vendor-router";
						if (id.includes("react-big-calendar")) return "vendor-calendar";
						if (id.includes("react-day-picker")) return "vendor-daypicker";
						if (id.includes("react-hook-form") || id.includes("@hookform"))
							return "vendor-form";
						if (id.includes("react")) return "vendor-react";
						if (id.includes("@radix-ui")) return "vendor-ui";
						if (id.includes("@dnd-kit")) return "vendor-dnd";
						if (id.includes("recharts")) return "vendor-charts";
						if (id.includes("date-fns")) return "vendor-date-fns";
						if (id.includes("lucide-react")) return "vendor-lucide";
						if (id.includes("framer-motion")) return "vendor-framer";
						if (id.includes("apexcharts") || id.includes("react-apexcharts"))
							return "vendor-apex";
						if (id.includes("zustand")) return "vendor-zustand";
						if (id.includes("cmdk")) return "vendor-cmdk";
						if (id.includes("sonner")) return "vendor-sonner";
						return "vendor";
					}
				},
			},
		},
	},
});
