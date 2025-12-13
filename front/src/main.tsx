import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./index.css";

import CalendarView from "./features/calendar/components/CalendarView";
import Analytics from "./pages/analytics/index";
import Login from "./pages/login/index";
import Settings from "./pages/settings/index";
import Todo from "./pages/todo/index";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/auth" element={<Login />} />

				<Route element={<AppLayout />}>
					<Route path="/home" element={<div>Home (Placeholder)</div>} />
					<Route path="/tasks" element={<Todo />} />
					<Route path="/calendar" element={<CalendarView />} />
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
