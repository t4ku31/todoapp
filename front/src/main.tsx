import AppLayout from "@/components/layout/AppLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/config/env";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";
import "./index.css";

const Analytics = lazy(() => import("./pages/analytics/index"));
const CalendarPage = lazy(() => import("./pages/calendar/index"));
const FocusPage = lazy(() => import("./pages/focus/index"));
const HomePage = lazy(() => import("./pages/home/index"));
const Settings = lazy(() => import("./pages/settings/index"));
const Todo = lazy(() => import("./pages/todo/index"));

const AuthRedirect = () => {
	useEffect(() => {
		window.location.href = `${env.bffApiBaseUrl}/oauth2/authorization/bff-client`;
	}, []);
	return (
		<div className="flex items-center justify-center min-h-screen">
			<LoadingSpinner size="lg" />
		</div>
	);
};

function App() {
	return (
		<Router>
			<Suspense fallback={<LoadingSpinner size="lg" />}>
				<Routes>
					<Route path="/auth" element={<AuthRedirect />} />
					<Route path="/focus" element={<FocusPage />} />

					<Route element={<AppLayout />}>
						<Route path="/home" element={<HomePage />} />
						<Route path="/tasks/*" element={<Todo />} />
						<Route path="/calendar" element={<CalendarPage />} />
						<Route path="/analytics" element={<Analytics />} />
						<Route path="/settings" element={<Settings />} />
						{/* Keep /todo as alias or redirect for backward compatibility if needed, or just redirect */}
						<Route path="/todo" element={<Navigate to="/tasks" replace />} />
					</Route>

					<Route path="/" element={<Navigate to="/auth" replace />} />
				</Routes>
			</Suspense>
		</Router>
	);
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	},
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
			<Toaster />
		</QueryClientProvider>
	</StrictMode>,
);
