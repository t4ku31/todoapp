import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

import Analytics from "./pages/analytics/index";
import CalendarPage from "./pages/calendar/index";
import FocusPage from "./pages/focus/index";
import HomePage from "./pages/home/index";
import Login from "./pages/login/index";
import Settings from "./pages/settings/index";
import Todo from "./pages/todo/index";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/auth" element={<Login />} />
				<Route path="/focus" element={<FocusPage />} />

				<Route element={<AppLayout />}>
					<Route path="/home" element={<HomePage />} />
					<Route path="/tasks" element={<Todo />} />
					<Route path="/calendar" element={<CalendarPage />} />
					<Route path="/analytics" element={<Analytics />} />
					<Route path="/settings" element={<Settings />} />
					{/* Keep /todo as alias or redirect for backward compatibility if needed, or just redirect */}
					<Route path="/todo" element={<Navigate to="/tasks" replace />} />
				</Route>

				<Route path="/" element={<Navigate to="/auth" replace />} />
			</Routes>
		</Router>
	);
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<App />
		<Toaster />
	</StrictMode>,
);
